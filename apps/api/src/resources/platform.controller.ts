import {
  Body,
  Controller,
  Delete,
  ExecutionContext,
  ForbiddenException,
  Get,
  Injectable,
  NotFoundException,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuthUser } from "./domain.service";
import { schemaNames } from "../database/schema-names";
import { AuthGuard } from "@nestjs/passport";


@Injectable()
class OptionalJwtGuard extends AuthGuard("jwt") {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
  handleRequest(_err: any, user: any) {
    return user ?? null; // never throw — just return null for guests
  }
}

const ALLOWED_TAGS = [
  "broiler", "layer", "chick", "egg", "local-chicken",
  "disease", "vaccination", "feed", "market-prices",
  "business", "tips", "news", "question", "general",
];

function sanitizeMediaUrls(urls?: string[]) {
  return (urls ?? [])
    .filter((url) => typeof url === "string")
    .map((url) => url.trim())
    .filter((url) => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === "https:" || parsed.protocol === "http:";
      } catch {
        return false;
      }
    })
    .slice(0, 4);
}

@Controller("platform")
export class PlatformController {
  constructor(
    @InjectModel(schemaNames.Post) private readonly PostModel: Model<any>,
    @InjectModel(schemaNames.Comment) private readonly CommentModel: Model<any>,
    @InjectModel(schemaNames.PostFollow) private readonly FollowModel: Model<any>,
    @InjectModel(schemaNames.User) private readonly UserModel: Model<any>,
  ) {}

  // ─── Feed ────────────────────────────────────────────────────────────────────

  @Get("posts")
  async getPosts(
    @Query("tag") tag?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("authorId") authorId?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page ?? "1", 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit ?? "20", 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter: any = { isHidden: false };
    if (tag && ALLOWED_TAGS.includes(tag)) filter.tags = tag;
    if (authorId && Types.ObjectId.isValid(authorId)) filter.authorId = new Types.ObjectId(authorId);

    const [posts, total] = await Promise.all([
      this.PostModel.find(filter)
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("authorId", "fullName avatar roles city isVerified")
        .populate("productId", "name price quantity unit images status approvalStatus farmId shopId")
        .populate("farmId", "name city region location verificationStatus coordinates pickupAvailable openingHours phone")
        .populate("shopId", "name city region location verificationStatus coordinates pickupAvailable openingHours phone")
        .lean(),
      this.PostModel.countDocuments(filter),
    ]);

    return { data: posts, total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) };
  }

  /** Lightweight stories strip for the customer media home */
  @Get("stories")
  async getStories() {
    const [farms, shops, products, posts] = await Promise.all([
      this.PostModel.db.model(schemaNames.Farm).find({ verificationStatus: "approved", status: "active" }).limit(8).select("name city images").lean(),
      this.PostModel.db.model(schemaNames.Shop).find({ verificationStatus: "approved", status: "active" }).limit(8).select("name city images logo").lean(),
      this.PostModel.db.model(schemaNames.Product).find({ approvalStatus: "approved", status: "available" }).sort({ createdAt: -1 }).limit(8).select("name images").lean(),
      this.PostModel.find({ isHidden: false, mediaUrls: { $exists: true, $ne: [] } }).sort({ createdAt: -1 }).limit(6).select("content mediaUrls tags").lean(),
    ]);

    const stories = [
      ...farms.map((f: any) => ({
        id: `farm-${f._id}`,
        type: "farm",
        label: f.name,
        subtitle: f.city || "Farm",
        image: f.images?.[0] || "/images/seed/modern-poultry-farm.png",
        href: `/farms/${f._id}`,
      })),
      ...shops.map((s: any) => ({
        id: `shop-${s._id}`,
        type: "shop",
        label: s.name,
        subtitle: s.city || "Shop",
        image: s.images?.[0] || s.logo || "/images/seed/shop-supplies.png",
        href: `/shops/${s._id}`,
      })),
      ...products.map((p: any) => ({
        id: `product-${p._id}`,
        type: "product",
        label: p.name,
        subtitle: "Available now",
        image: p.images?.[0] || "/images/seed/eggs-poultry-products.png",
        href: `/products/${p._id}`,
      })),
      ...posts.map((p: any) => ({
        id: `post-${p._id}`,
        type: "update",
        label: (p.content || "Update").slice(0, 28),
        subtitle: p.tags?.[0] || "Harvest",
        image: p.mediaUrls?.[0] || "/images/seed/eggs-poultry-products.png",
        href: `/dashboard/customer`,
      })),
    ].slice(0, 16);

    return { data: stories };
  }

  // ─── Create Post ─────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post("posts")
  async createPost(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      content: string;
      tags?: string[];
      mediaUrls?: string[];
      productId?: string;
      farmId?: string;
      shopId?: string;
      locationLabel?: string;
    },
  ) {
    if (!body.content?.trim()) {
      throw new ForbiddenException("Post content is required.");
    }
    if (body.content.length > 2000) {
      throw new ForbiddenException("Post content cannot exceed 2000 characters.");
    }

    const authorRole = (user.roles ?? ["customer"])[0];
    const sanitizedTags = Array.from(new Set(body.tags ?? []))
      .filter((t) => typeof t === "string" && ALLOWED_TAGS.includes(t))
      .slice(0, 5);

    const post = await this.PostModel.create({
      authorId: user.id,
      authorRole,
      content: body.content.trim(),
      tags: sanitizedTags,
      mediaUrls: sanitizeMediaUrls(body.mediaUrls),
      productId: body.productId && Types.ObjectId.isValid(body.productId) ? body.productId : undefined,
      farmId: body.farmId && Types.ObjectId.isValid(body.farmId) ? body.farmId : undefined,
      shopId: body.shopId && Types.ObjectId.isValid(body.shopId) ? body.shopId : undefined,
      locationLabel: body.locationLabel?.trim()?.slice(0, 120),
    });

    return post.populate([
      { path: "authorId", select: "fullName avatar roles city isVerified" },
      { path: "productId", select: "name price quantity unit images status approvalStatus farmId shopId" },
      { path: "farmId", select: "name city region location verificationStatus pickupAvailable openingHours phone" },
      { path: "shopId", select: "name city region location verificationStatus pickupAvailable openingHours phone" },
    ]);
  }

  // ─── Delete Post ─────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Delete("posts/:id")
  async deletePost(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException("Post not found.");
    const post = await this.PostModel.findById(id).lean();
    if (!post) throw new NotFoundException("Post not found.");

    const isAdmin = user.roles?.some((r) => ["admin", "super_admin"].includes(r));
    const isAuthor = post.authorId.toString() === user.id.toString();
    if (!isAdmin && !isAuthor) throw new ForbiddenException("You are not authorised to delete this post.");

    await this.PostModel.findByIdAndDelete(id);
    await this.CommentModel.deleteMany({ postId: new Types.ObjectId(id) });
    return { message: "Post deleted." };
  }

  // ─── Like / Unlike Post ───────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post("posts/:id/like")
  async toggleLike(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException("Post not found.");
    const uid = new Types.ObjectId(user.id);
    const post = await this.PostModel.findById(id);
    if (!post || post.isHidden) throw new NotFoundException("Post not found.");

    const alreadyLiked = post.likes.some((l: Types.ObjectId) => l.equals(uid));
    if (alreadyLiked) {
      post.likes = post.likes.filter((l: Types.ObjectId) => !l.equals(uid));
    } else {
      post.likes.push(uid);
    }
    await post.save();
    return { liked: !alreadyLiked, likeCount: post.likes.length };
  }

  @UseGuards(JwtAuthGuard)
  @Post("posts/:id/save")
  async toggleSave(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException("Post not found.");
    const uid = new Types.ObjectId(user.id);
    const post = await this.PostModel.findById(id);
    if (!post || post.isHidden) throw new NotFoundException("Post not found.");

    const saves: Types.ObjectId[] = post.saves ?? [];
    const alreadySaved = saves.some((l: Types.ObjectId) => l.equals(uid));
    post.saves = alreadySaved
      ? saves.filter((l: Types.ObjectId) => !l.equals(uid))
      : [...saves, uid];
    await post.save();
    return { saved: !alreadySaved, saveCount: post.saves.length };
  }

  // ─── Comments ────────────────────────────────────────────────────────────────

  @Get("posts/:id/comments")
  async getComments(@Param("id") id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException("Post not found.");
    const comments = await this.CommentModel.find({ postId: new Types.ObjectId(id), isHidden: false })
      .sort({ createdAt: 1 })
      .populate("authorId", "fullName avatar roles city")
      .lean();
    return { data: comments };
  }

  @UseGuards(JwtAuthGuard)
  @Post("posts/:id/comments")
  async createComment(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: { content: string; parentCommentId?: string },
  ) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException("Post not found.");
    if (!body.content?.trim()) throw new ForbiddenException("Comment content is required.");
    if (body.content.length > 1000) throw new ForbiddenException("Comment cannot exceed 1000 characters.");

    const post = await this.PostModel.findById(id);
    if (!post || post.isHidden) throw new NotFoundException("Post not found.");

    const commentData: any = {
      postId: new Types.ObjectId(id),
      authorId: user.id,
      content: body.content.trim(),
    };
    if (body.parentCommentId && Types.ObjectId.isValid(body.parentCommentId)) {
      commentData.parentCommentId = new Types.ObjectId(body.parentCommentId);
    }

    const comment = await this.CommentModel.create(commentData);
    await this.PostModel.findByIdAndUpdate(id, { $inc: { commentCount: 1 } });
    return comment.populate("authorId", "fullName avatar roles city");
  }

  @UseGuards(JwtAuthGuard)
  @Delete("comments/:id")
  async deleteComment(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException("Comment not found.");
    const comment = await this.CommentModel.findById(id).lean();
    if (!comment) throw new NotFoundException("Comment not found.");

    const isAdmin = user.roles?.some((r) => ["admin", "super_admin"].includes(r));
    const isAuthor = comment.authorId.toString() === user.id.toString();
    if (!isAdmin && !isAuthor) throw new ForbiddenException("You are not authorised to delete this comment.");

    await this.CommentModel.findByIdAndDelete(id);
    await this.PostModel.findByIdAndUpdate(comment.postId, { $inc: { commentCount: -1 } });
    return { message: "Comment deleted." };
  }

  // ─── Follow / Unfollow ───────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post("follow/:targetId")
  async toggleFollow(@Param("targetId") targetId: string, @CurrentUser() user: AuthUser) {
    if (!Types.ObjectId.isValid(targetId)) throw new NotFoundException("User not found.");
    if (targetId === user.id.toString()) throw new ForbiddenException("You cannot follow yourself.");

    const existing = await this.FollowModel.findOne({
      followerId: user.id,
      followingId: new Types.ObjectId(targetId),
    });

    if (existing) {
      await existing.deleteOne();
      return { following: false };
    }

    await this.FollowModel.create({ followerId: user.id, followingId: new Types.ObjectId(targetId) });
    return { following: true };
  }

  // ─── Public Profile ──────────────────────────────────────────────────────────

  @Get("users/:id/profile")
  async getPublicProfile(@Param("id") id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException("User not found.");
    const userDoc = await this.UserModel.findById(id)
      .select("fullName avatar roles city region country createdAt")
      .lean();
    if (!userDoc) throw new NotFoundException("User not found.");

    const [postCount, followerCount, followingCount] = await Promise.all([
      this.PostModel.countDocuments({ authorId: new Types.ObjectId(id), isHidden: false }),
      this.FollowModel.countDocuments({ followingId: new Types.ObjectId(id) }),
      this.FollowModel.countDocuments({ followerId: new Types.ObjectId(id) }),
    ]);

    return { ...userDoc, postCount, followerCount, followingCount };
  }

  // ─── Trending Tags ───────────────────────────────────────────────────────────

  @Get("trending-tags")
  async getTrendingTags() {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // last 30 days
    const pipeline = [
      { $match: { isHidden: false, createdAt: { $gte: since } } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ];
    const results = await this.PostModel.aggregate(pipeline as any);
    return { data: results.map((r: any) => ({ tag: r._id, count: r.count })) };
  }

  // ─── Who to Follow suggestions ───────────────────────────────────────────────

  @UseGuards(OptionalJwtGuard)
  @Get("suggestions")
  async getSuggestions(@Request() req: any) {
    const userId = req.user?.id;
    const filter: any = { status: "active" };
    if (userId) filter._id = { $ne: new Types.ObjectId(userId) };

    const users = await this.UserModel.find(filter)
      .select("fullName avatar roles city")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    if (!userId) {
      return { data: users.map((user) => ({ ...user, following: false })) };
    }

    const followingIds = new Set(
      (
        await this.FollowModel.find({
          followerId: new Types.ObjectId(userId),
          followingId: { $in: users.map((user) => user._id) },
        })
          .select("followingId")
          .lean()
      ).map((follow) => follow.followingId.toString())
    );

    return {
      data: users.map((user) => ({
        ...user,
        following: followingIds.has(user._id.toString()),
      })),
    };
  }
}
