# SOFTWARE REQUIREMENTS SPECIFICATION

## PoultryHub: Integrated Poultry Farm Management and Marketplace Platform

**Version:** 1.0
**Prepared for:** Codex Implementation
**Project Domain:** Agriculture, Poultry Farming, Farm Management, Marketplace
**Recommended Stack:** Next.js, TypeScript, Node.js/NestJS, MongoDB, Mongoose, Socket.IO
**Target Users:** Farmers, shopkeepers, customers, visitors, admins
**Primary Market:** Cameroon and African poultry/agriculture ecosystem

---

# Document Control

## Revision History

| Version | Date       | Description                  | Author |
| ------- | ---------- | ---------------------------- | ------ |
| 1.0     | 2026-06-02 | Initial full SRS draft       | Codex  |

## Document Purpose

This Software Requirements Specification defines the business, functional, non-functional, data, API, interface, security, and delivery requirements for PoultryHub.

The document is intended to be used as:

```txt
the master product requirements document
the implementation guide for Codex
the validation reference for testing
the scope control document for MVP delivery
the onboarding reference for future developers
```

## Requirement Language

The words shall, must, and required indicate mandatory requirements.

The words should and recommended indicate preferred requirements that may be adjusted when implementation constraints require it.

The word may indicates optional behavior.

---

# 1. Project Overview

## 1.1 Project Name

The official project name shall be:

## **PoultryHub**

Full formal title:

## **PoultryHub: Integrated Poultry Farm Management and Marketplace Platform**

## 1.2 Project Description

PoultryHub is a web-based and future mobile-ready platform designed to manage the poultry farming ecosystem. The system shall allow users to create and manage poultry farms, create and manage poultry shops, sell poultry-related products, track poultry production, manage orders, process payments, and generate business reports.

The platform shall support a flexible user model where a single user can have:

```txt
zero farms
one farm
many farms
zero shops
one shop
many shops
multiple roles
```

The system shall support farmers, shopkeepers, customers, visitors, administrators, and super administrators.

## 1.3 Main Purpose

The purpose of PoultryHub is to provide a centralized digital platform for:

```txt
poultry farm management
poultry batch tracking
feed management
mortality tracking
vaccination tracking
egg production tracking
farm expenses and revenue tracking
shop and product management
customer orders
marketplace sales
digital payments
notifications
analytics and reporting
```

## 1.4 Core Business Vision

PoultryHub shall not be a simple marketplace only. It shall be a full poultry business ecosystem.

The system must help:

```txt
farmers manage farms professionally
shopkeepers sell poultry supplies
customers buy eggs, chickens, chicks, feed, medicine, and equipment
admins verify farms and shops
the platform generate trusted poultry market data
```

---

# 2. Product Scope

## 2.1 In Scope

The first complete version shall include:

```txt
user authentication
role-based access control
farm management
shop management
product management
marketplace
cart
orders
payments
admin dashboard
farmer dashboard
shopkeeper dashboard
customer dashboard
poultry batch management
feeding records
mortality records
vaccination records
egg production records
expenses
sales records
notifications
reports
real-time updates
```

## 2.2 Out of Scope for Version 1

The following features shall not be mandatory in Version 1, but the architecture must allow them later:

```txt
native mobile app
offline sync
AI poultry assistant
disease prediction
IoT sensor integration
blockchain traceability
delivery driver app
advanced cooperative management
government regulatory reporting
```

## 2.3 Future Expansion

The system shall be designed so that future versions can support:

```txt
React Native mobile app
offline-first farm data collection
AI disease diagnosis assistant
WhatsApp bot
QR farm verification
mobile money automation
inventory forecasting
multi-language support
French and English UI
cooperative/group farming support
```

---

# 3. Stakeholders

## 3.1 Primary Stakeholders

| Stakeholder    | Interest                                                               |
| -------------- | ---------------------------------------------------------------------- |
| Farmers        | Manage farms, poultry batches, expenses, mortality, vaccination, sales |
| Shopkeepers    | Sell poultry feed, vaccines, medicine, equipment, chicks               |
| Customers      | Buy poultry products and shop products                                 |
| Visitors       | Browse products, farms, shops, and register                            |
| Admins         | Verify users, farms, shops, products, orders, and payments             |
| Super Admin    | Full system control                                                    |
| Platform Owner | Monetization, growth, compliance, analytics                            |

## 3.2 Secondary Stakeholders

```txt
veterinary service providers
feed suppliers
restaurants
hotels
egg wholesalers
chicken retailers
agricultural cooperatives
NGOs
government agricultural programs
delivery partners
```

---

# 4. User Classes and Roles

## 4.1 Visitor

A visitor is an unauthenticated user.

### Visitor Permissions

```txt
view home page
view public products
view public farms
view public shops
view product details
search marketplace
register account
login
contact platform support through public contact form
```

### Visitor Restrictions

```txt
cannot place orders
cannot create farms
cannot create shops
cannot message sellers
cannot access dashboards
```

## 4.2 Customer

A customer is an authenticated user who can buy products.

### Customer Permissions

```txt
manage profile
browse marketplace
add products to cart
place orders
make payments
track orders
review products
message sellers
view payment history
follow farms
follow shops
```

## 4.3 Farmer

A farmer is an authenticated user who owns or manages one or many farms.

### Farmer Permissions

```txt
create farm
update own farm
manage own farm batches
record feeding
record mortality
record vaccination
record egg production
record expenses
record farm sales
publish farm products
view farm reports
receive farm-related orders
message customers
```

## 4.4 Shopkeeper

A shopkeeper is an authenticated user who owns or manages one or many shops.

### Shopkeeper Permissions

```txt
create shop
update own shop
add shop products
manage product stock
process orders
view shop reports
message customers
receive product reviews
```

## 4.5 Admin

An admin manages platform operations.

### Admin Permissions

```txt
view admin dashboard
manage users
approve farms
reject farms
approve shops
reject shops
approve products
reject products
manage orders
view reports
suspend users
review complaints
manage categories
```

## 4.6 Super Admin

The super admin has all admin permissions plus:

```txt
create admins
remove admins
manage system settings
manage platform fees
manage payment providers
view audit logs
configure global permissions
```

---

# 5. Core Business Rules

## 5.1 User Ownership Rules

```txt
A user may have zero farms.
A user may have many farms.
A user may have zero shops.
A user may have many shops.
A user may be both farmer and shopkeeper.
A user may be customer, farmer, and shopkeeper at the same time.
A user may not update a farm they do not own unless they are admin or super admin.
A user may not update a shop they do not own unless they are admin or super admin.
```

## 5.2 Farm Rules

```txt
A farm must belong to one user.
A farm must be approved before appearing publicly.
A farm may have many poultry batches.
A farm may publish farm products after approval.
A farm can be suspended by admin.
A suspended farm shall not sell products.
```

## 5.3 Shop Rules

```txt
A shop must belong to one user.
A shop must be approved before appearing publicly.
A shop may have many products.
A suspended shop shall not sell products.
```

## 5.4 Product Rules

```txt
A product must belong to either a farm or a shop.
A farm product must reference a farm.
A shop product must reference a shop.
A product cannot belong to both a farm and a shop unless explicitly configured as a hybrid listing.
A product must be approved before appearing publicly.
Product quantity cannot be negative.
Product price must be greater than zero.
```

## 5.5 Order Rules

```txt
Only authenticated customers can place orders.
The server must calculate order totals.
The client must never be trusted for total amounts.
An order must contain at least one item.
An order item quantity cannot exceed available stock.
When an order is confirmed, stock should be reserved or reduced depending on order policy.
A seller can only process orders belonging to their farm or shop.
```

## 5.6 Payment Rules

```txt
Payment must be verified before marking an order as paid.
Payment callbacks must be authenticated or validated.
A failed payment must not mark an order as paid.
A paid order must have a transaction reference.
```

---

# 6. Functional Requirements

# 6.1 Authentication Module

## 6.1.1 Description

The system shall provide secure authentication for users.

## 6.1.2 Functional Requirements

| ID       | Requirement                                                                          |
| -------- | ------------------------------------------------------------------------------------ |
| AUTH-001 | The system shall allow users to register with full name, email, phone, and password. |
| AUTH-002 | The system shall validate that email is unique.                                      |
| AUTH-003 | The system shall validate that phone number is unique where required.                |
| AUTH-004 | The system shall hash passwords before saving.                                       |
| AUTH-005 | The system shall allow users to log in using email or phone.                         |
| AUTH-006 | The system shall issue access tokens after successful login.                         |
| AUTH-007 | The system shall support refresh tokens.                                             |
| AUTH-008 | The system shall allow users to log out.                                             |
| AUTH-009 | The system shall allow password reset.                                               |
| AUTH-010 | The system shall expose a `/me` endpoint for the authenticated user.                 |

## 6.1.3 Acceptance Criteria

```txt
A user can register successfully.
A registered user can log in.
Wrong credentials are rejected.
Passwords are never stored in plain text.
Authenticated routes reject unauthenticated requests.
```

---

# 6.2 User and Role Management Module

## 6.2.1 Description

The system shall manage users and their roles.

## 6.2.2 Functional Requirements

| ID       | Requirement                                                             |
| -------- | ----------------------------------------------------------------------- |
| USER-001 | The system shall allow users to update their profile.                   |
| USER-002 | The system shall allow users to upload a profile photo.                 |
| USER-003 | The system shall allow admins to view all users.                        |
| USER-004 | The system shall allow admins to suspend users.                         |
| USER-005 | The system shall allow admins to activate suspended users.              |
| USER-006 | The system shall allow users to have multiple roles.                    |
| USER-007 | The system shall allow a user to request farmer role.                   |
| USER-008 | The system shall allow a user to request shopkeeper role.               |
| USER-009 | The system shall automatically assign customer role after registration. |
| USER-010 | The system shall allow super admin to assign admin role.                |

## 6.2.3 Roles

```txt
visitor
customer
farmer
shopkeeper
admin
super_admin
```

## 6.2.4 Acceptance Criteria

```txt
A user can have multiple roles.
A farmer can also be a shopkeeper.
An admin can suspend a user.
A suspended user cannot perform protected business actions.
```

---

# 6.3 Farm Management Module

## 6.3.1 Description

The system shall allow farmers to create and manage poultry farms.

## 6.3.2 Functional Requirements

| ID       | Requirement                                                                     |
| -------- | ------------------------------------------------------------------------------- |
| FARM-001 | The system shall allow authenticated users to create farms.                     |
| FARM-002 | The system shall assign the farm owner to the authenticated user.               |
| FARM-003 | The system shall allow farm owners to update farm details.                      |
| FARM-004 | The system shall allow farm owners to upload farm images.                       |
| FARM-005 | The system shall allow admins to approve farms.                                 |
| FARM-006 | The system shall allow admins to reject farms with a reason.                    |
| FARM-007 | The system shall allow admins to suspend farms.                                 |
| FARM-008 | The system shall list only approved farms publicly.                             |
| FARM-009 | The system shall allow users to view farm details.                              |
| FARM-010 | The system shall allow farmers to view only their own farms in their dashboard. |

## 6.3.3 Farm Fields

```txt
ownerId
name
description
farmType
location
city
region
country
latitude
longitude
phone
images
verificationStatus
status
createdAt
updatedAt
```

## 6.3.4 Farm Types

```txt
broiler
layer
chick_production
egg_production
mixed_poultry
local_chicken
```

## 6.3.5 Farm Status

```txt
active
inactive
suspended
deleted
```

## 6.3.6 Farm Verification Status

```txt
pending
approved
rejected
```

## 6.3.7 Acceptance Criteria

```txt
A user can create multiple farms.
A farm remains pending until admin approval.
Only approved farms appear publicly.
Only the farm owner or admin can update farm information.
```

---

# 6.4 Poultry Batch Management Module

## 6.4.1 Description

A poultry batch represents a specific group of birds on a farm.

Example:

```txt
Batch 001: 500 broilers
Batch 002: 300 layers
Batch 003: 100 chicks
```

## 6.4.2 Functional Requirements

| ID        | Requirement                                                        |
| --------- | ------------------------------------------------------------------ |
| BATCH-001 | The system shall allow farmers to create a batch under their farm. |
| BATCH-002 | The system shall generate or accept a batch code.                  |
| BATCH-003 | The system shall track initial quantity.                           |
| BATCH-004 | The system shall track current quantity.                           |
| BATCH-005 | The system shall allow farmers to update batch details.            |
| BATCH-006 | The system shall allow farmers to close a batch.                   |
| BATCH-007 | The system shall calculate mortality rate.                         |
| BATCH-008 | The system shall calculate current bird count.                     |
| BATCH-009 | The system shall show active batches on farm dashboard.            |

## 6.4.3 Batch Fields

```txt
farmId
name
batchCode
poultryType
breed
initialQuantity
currentQuantity
startDate
expectedMaturityDate
status
notes
createdAt
updatedAt
```

## 6.4.4 Batch Status

```txt
active
completed
sold
cancelled
lost
```

## 6.4.5 Acceptance Criteria

```txt
A farm can have many batches.
A batch belongs to one farm.
Current quantity updates after mortality records.
Closed batches cannot receive new production records unless reopened by authorized user.
```

---

# 6.5 Feeding Management Module

## 6.5.1 Description

The system shall allow farmers to track feed usage per batch.

## 6.5.2 Functional Requirements

| ID       | Requirement                                           |
| -------- | ----------------------------------------------------- |
| FEED-001 | The system shall allow farmers to record feed usage.  |
| FEED-002 | The system shall link feeding records to a batch.     |
| FEED-003 | The system shall store feed type.                     |
| FEED-004 | The system shall store quantity and unit.             |
| FEED-005 | The system shall store feed cost.                     |
| FEED-006 | The system shall calculate total feed cost per batch. |
| FEED-007 | The system shall calculate feed consumed per bird.    |

## 6.5.3 Feed Record Fields

```txt
farmId
batchId
feedType
quantity
unit
cost
feedingDate
recordedBy
notes
createdAt
updatedAt
```

## 6.5.4 Feed Types

```txt
starter
grower
finisher
layer_mash
broiler_feed
corn_mix
custom
```

## 6.5.5 Acceptance Criteria

```txt
A farmer can add feeding records to their own batch.
Total feed cost is visible on batch report.
Invalid negative quantities are rejected.
```

---

# 6.6 Mortality Management Module

## 6.6.1 Description

The system shall track bird deaths and update batch quantity.

## 6.6.2 Functional Requirements

| ID       | Requirement                                                                  |
| -------- | ---------------------------------------------------------------------------- |
| MORT-001 | The system shall allow farmers to record mortality.                          |
| MORT-002 | The system shall link mortality to a batch.                                  |
| MORT-003 | The system shall reduce current batch quantity after mortality record.       |
| MORT-004 | The system shall prevent mortality quantity from exceeding current quantity. |
| MORT-005 | The system shall calculate mortality rate.                                   |
| MORT-006 | The system shall allow farmers to specify suspected cause.                   |

## 6.6.3 Mortality Fields

```txt
farmId
batchId
numberOfDeaths
cause
date
actionTaken
recordedBy
notes
createdAt
updatedAt
```

## 6.6.4 Mortality Causes

```txt
disease
heat
cold
poor_feeding
accident
predators
transport_stress
unknown
```

## 6.6.5 Acceptance Criteria

```txt
Current batch quantity decreases after valid mortality record.
Mortality quantity cannot exceed current birds.
Mortality rate is automatically recalculated.
```

---

# 6.7 Vaccination and Medication Module

## 6.7.1 Description

The system shall manage vaccination schedules and medication records.

## 6.7.2 Functional Requirements

| ID       | Requirement                                                           |
| -------- | --------------------------------------------------------------------- |
| VACC-001 | The system shall allow farmers to create vaccination schedules.       |
| VACC-002 | The system shall allow farmers to mark vaccinations as completed.     |
| VACC-003 | The system shall notify farmers of upcoming vaccinations.             |
| VACC-004 | The system shall allow farmers to record vaccine cost.                |
| VACC-005 | The system shall allow farmers to record administered-by information. |
| VACC-006 | The system shall display missed vaccinations.                         |

## 6.7.3 Vaccination Fields

```txt
farmId
batchId
vaccineName
diseasePrevented
scheduledDate
completedDate
status
cost
administeredBy
notes
createdAt
updatedAt
```

## 6.7.4 Vaccination Status

```txt
scheduled
completed
missed
cancelled
```

## 6.7.5 Acceptance Criteria

```txt
Farmers can schedule vaccination.
Farmers can complete vaccination.
Upcoming vaccination appears in farmer dashboard.
Missed vaccination is highlighted.
```

---

# 6.8 Egg Production Module

## 6.8.1 Description

The system shall allow layer farmers to record daily egg production.

## 6.8.2 Functional Requirements

| ID      | Requirement                                                      |
| ------- | ---------------------------------------------------------------- |
| EGG-001 | The system shall allow farmers to record daily eggs collected.   |
| EGG-002 | The system shall allow farmers to record damaged eggs.           |
| EGG-003 | The system shall allow farmers to record eggs sold.              |
| EGG-004 | The system shall calculate remaining eggs.                       |
| EGG-005 | The system shall calculate production rate.                      |
| EGG-006 | The system shall display daily, weekly, and monthly egg reports. |

## 6.8.3 Egg Production Fields

```txt
farmId
batchId
date
eggsCollected
damagedEggs
eggsSold
remainingEggs
notes
createdAt
updatedAt
```

## 6.8.4 Acceptance Criteria

```txt
Egg records can be added only to the farmer’s own batch.
Damaged eggs cannot exceed collected eggs.
Eggs sold cannot exceed available eggs.
Production reports are generated correctly.
```

---

# 6.9 Expense Management Module

## 6.9.1 Description

The system shall allow farmers and shopkeepers to track expenses.

## 6.9.2 Functional Requirements

| ID      | Requirement                                                               |
| ------- | ------------------------------------------------------------------------- |
| EXP-001 | The system shall allow farmers to record farm expenses.                   |
| EXP-002 | The system shall allow shopkeepers to record shop expenses.               |
| EXP-003 | The system shall allow expenses to be linked to a batch where applicable. |
| EXP-004 | The system shall categorize expenses.                                     |
| EXP-005 | The system shall calculate total expenses per farm, shop, and batch.      |
| EXP-006 | The system shall allow receipt image upload.                              |

## 6.9.3 Expense Categories

```txt
feed
medicine
vaccination
labor
transport
water
electricity
equipment
rent
maintenance
other
```

## 6.9.4 Expense Fields

```txt
ownerId
farmId optional
shopId optional
batchId optional
category
amount
date
description
receiptImage
createdAt
updatedAt
```

---

# 6.10 Farm Sales Module

## 6.10.1 Description

The system shall allow farmers to record direct farm sales.

## 6.10.2 Functional Requirements

| ID       | Requirement                                           |
| -------- | ----------------------------------------------------- |
| SALE-001 | The system shall allow farmers to record sales.       |
| SALE-002 | The system shall allow sales to be linked to a batch. |
| SALE-003 | The system shall calculate total sale amount.         |
| SALE-004 | The system shall support multiple product types.      |
| SALE-005 | The system shall update reports after a sale.         |

## 6.10.3 Sale Product Types

```txt
eggs
live_chicken
dressed_chicken
chicks
manure
spent_layers
other
```

## 6.10.4 Sale Fields

```txt
farmId
batchId optional
productType
quantity
unit
unitPrice
totalAmount
buyerName
paymentMethod
saleDate
notes
createdAt
updatedAt
```

---

# 6.11 Shop Management Module

## 6.11.1 Description

The system shall allow users to create and manage poultry-related shops.

## 6.11.2 Functional Requirements

| ID       | Requirement                                                        |
| -------- | ------------------------------------------------------------------ |
| SHOP-001 | The system shall allow authenticated users to create shops.        |
| SHOP-002 | The system shall assign the shop owner to the authenticated user.  |
| SHOP-003 | The system shall allow shop owners to update shop information.     |
| SHOP-004 | The system shall allow shop owners to upload shop logo and photos. |
| SHOP-005 | The system shall allow admins to approve shops.                    |
| SHOP-006 | The system shall allow admins to reject shops with reason.         |
| SHOP-007 | The system shall list only approved shops publicly.                |
| SHOP-008 | The system shall allow shopkeepers to view their shops.            |

## 6.11.3 Shop Fields

```txt
ownerId
name
description
location
city
region
country
phone
logo
images
verificationStatus
status
createdAt
updatedAt
```

---

# 6.12 Product Management Module

## 6.12.1 Description

The system shall support both farm products and shop products.

## 6.12.2 Product Types

```txt
farm_product
shop_product
```

## 6.12.3 Farm Product Examples

```txt
eggs
live_chicken
dressed_chicken
chicks
manure
spent_layers
```

## 6.12.4 Shop Product Examples

```txt
feed
vaccines
medicine
vitamins
feeders
drinkers
cages
incubators
egg_trays
farm_tools
```

## 6.12.5 Functional Requirements

| ID       | Requirement                                                          |
| -------- | -------------------------------------------------------------------- |
| PROD-001 | The system shall allow approved farmers to create farm products.     |
| PROD-002 | The system shall allow approved shopkeepers to create shop products. |
| PROD-003 | The system shall allow product images.                               |
| PROD-004 | The system shall support product categories.                         |
| PROD-005 | The system shall support product approval by admin.                  |
| PROD-006 | The system shall allow product stock management.                     |
| PROD-007 | The system shall prevent negative stock.                             |
| PROD-008 | The system shall allow product search and filtering.                 |

## 6.12.6 Product Fields

```txt
ownerId
farmId optional
shopId optional
productType
name
description
categoryId
price
quantity
unit
images
status
approvalStatus
createdAt
updatedAt
```

---

# 6.13 Marketplace Module

## 6.13.1 Description

The marketplace shall allow users to browse, search, filter, and buy poultry-related products.

## 6.13.2 Functional Requirements

| ID         | Requirement                                        |
| ---------- | -------------------------------------------------- |
| MARKET-001 | The system shall list approved available products. |
| MARKET-002 | The system shall allow search by product name.     |
| MARKET-003 | The system shall allow filtering by category.      |
| MARKET-004 | The system shall allow filtering by location.      |
| MARKET-005 | The system shall allow filtering by product type.  |
| MARKET-006 | The system shall show product details.             |
| MARKET-007 | The system shall show seller details.              |
| MARKET-008 | The system shall show related products.            |

## 6.13.3 Search Filters

```txt
keyword
category
location
priceMin
priceMax
productType
sellerType
availability
```

---

# 6.14 Cart Module

## 6.14.1 Description

Customers shall use a cart before checkout.

## 6.14.2 Functional Requirements

| ID       | Requirement                                                    |
| -------- | -------------------------------------------------------------- |
| CART-001 | The system shall allow customers to add products to cart.      |
| CART-002 | The system shall allow customers to update cart item quantity. |
| CART-003 | The system shall allow customers to remove cart items.         |
| CART-004 | The system shall calculate subtotal.                           |
| CART-005 | The system shall validate stock before checkout.               |

## 6.14.3 Cart Fields

```txt
customerId
items
subtotal
createdAt
updatedAt
```

---

# 6.15 Order Module

## 6.15.1 Description

The order module shall manage customer purchases.

## 6.15.2 Functional Requirements

| ID        | Requirement                                                  |
| --------- | ------------------------------------------------------------ |
| ORDER-001 | The system shall allow customers to create orders from cart. |
| ORDER-002 | The system shall generate a unique order number.             |
| ORDER-003 | The system shall group order items by seller if needed.      |
| ORDER-004 | The system shall allow sellers to confirm orders.            |
| ORDER-005 | The system shall allow sellers to reject orders with reason. |
| ORDER-006 | The system shall allow customers to track orders.            |
| ORDER-007 | The system shall allow admins to view all orders.            |

## 6.15.3 Order Status

```txt
pending
confirmed
processing
ready
delivered
cancelled
rejected
```

## 6.15.4 Payment Status

```txt
unpaid
pending
paid
failed
refunded
```

## 6.15.5 Order Fields

```txt
customerId
sellerId
farmId optional
shopId optional
orderNumber
items
subtotal
deliveryFee
totalAmount
paymentStatus
orderStatus
deliveryMethod
deliveryAddress
notes
createdAt
updatedAt
```

---

# 6.16 Payment Module

## 6.16.1 Description

The system shall support payment tracking and future mobile money integration.

## 6.16.2 Supported Payment Methods

```txt
cash_on_delivery
mtn_mobile_money
orange_money
bank_transfer
wallet
```

## 6.16.3 Functional Requirements

| ID      | Requirement                                                            |
| ------- | ---------------------------------------------------------------------- |
| PAY-001 | The system shall allow customers to select payment method.             |
| PAY-002 | The system shall create payment records.                               |
| PAY-003 | The system shall store transaction reference.                          |
| PAY-004 | The system shall mark payment as pending until verified.               |
| PAY-005 | The system shall update order payment status after successful payment. |
| PAY-006 | The system shall reject invalid payment callbacks.                     |

## 6.16.4 Payment Fields

```txt
orderId
userId
amount
currency
paymentMethod
transactionReference
provider
status
providerResponse
paidAt
createdAt
updatedAt
```

---

# 6.17 Delivery Module

## 6.17.1 Description

The system shall support basic delivery tracking.

## 6.17.2 Delivery Methods

```txt
pickup_at_farm
pickup_at_shop
home_delivery
third_party_delivery
```

## 6.17.3 Delivery Status

```txt
not_required
pending
in_transit
delivered
failed
cancelled
```

## 6.17.4 Functional Requirements

| ID      | Requirement                                                 |
| ------- | ----------------------------------------------------------- |
| DEL-001 | The system shall allow customers to select delivery method. |
| DEL-002 | The system shall store delivery address.                    |
| DEL-003 | The system shall allow sellers to update delivery status.   |
| DEL-004 | The system shall allow customers to view delivery status.   |

---

# 6.18 Notification Module

## 6.18.1 Description

The system shall notify users about important events.

## 6.18.2 Notification Types

```txt
order_created
order_confirmed
order_cancelled
payment_received
farm_approved
farm_rejected
shop_approved
shop_rejected
product_approved
product_rejected
vaccination_due
low_stock
message_received
```

## 6.18.3 Functional Requirements

| ID        | Requirement                                                    |
| --------- | -------------------------------------------------------------- |
| NOTIF-001 | The system shall create in-app notifications.                  |
| NOTIF-002 | The system shall send real-time notifications using Socket.IO. |
| NOTIF-003 | The system shall mark notifications as read.                   |
| NOTIF-004 | The system shall allow users to view notification history.     |

---

# 6.19 Messaging Module

## 6.19.1 Description

The system shall allow customers, farmers, shopkeepers, and admins to communicate.

## 6.19.2 Functional Requirements

| ID      | Requirement                                                        |
| ------- | ------------------------------------------------------------------ |
| MSG-001 | The system shall allow authenticated users to start conversations. |
| MSG-002 | The system shall allow users to send messages.                     |
| MSG-003 | The system shall support real-time messaging using Socket.IO.      |
| MSG-004 | The system shall store message history.                            |
| MSG-005 | The system shall show unread message counts.                       |

## 6.19.3 Message Fields

```txt
conversationId
senderId
receiverId
body
attachments
readAt
createdAt
updatedAt
```

---

# 6.20 Review and Rating Module

## 6.20.1 Description

Customers shall be able to rate products, farms, and shops.

## 6.20.2 Functional Requirements

| ID         | Requirement                                                         |
| ---------- | ------------------------------------------------------------------- |
| REVIEW-001 | The system shall allow customers to review products they purchased. |
| REVIEW-002 | The system shall allow rating from 1 to 5.                          |
| REVIEW-003 | The system shall allow admins to moderate reviews.                  |
| REVIEW-004 | The system shall calculate average product rating.                  |
| REVIEW-005 | The system shall calculate average farm and shop rating.            |

---

# 6.21 Admin Dashboard Module

## 6.21.1 Description

The admin dashboard shall provide platform-wide management.

## 6.21.2 Admin Features

```txt
manage users
manage farms
manage shops
manage products
manage orders
manage payments
manage categories
manage reviews
view reports
view audit logs
configure settings
```

## 6.21.3 Admin Dashboard Metrics

```txt
total users
total farmers
total shopkeepers
total farms
total shops
total products
total orders
total revenue
pending farms
pending shops
pending products
active regions
top products
top farms
top shops
```

---

# 6.22 Category Management Module

## 6.22.1 Description

The system shall manage marketplace product categories used for browsing, filtering, reporting, and admin moderation.

## 6.22.2 Functional Requirements

| ID      | Requirement                                                    |
| ------- | -------------------------------------------------------------- |
| CAT-001 | The system shall allow admins to create product categories.    |
| CAT-002 | The system shall allow admins to update product categories.    |
| CAT-003 | The system shall allow admins to deactivate categories.        |
| CAT-004 | The system shall allow nested parent and child categories.     |
| CAT-005 | The system shall expose active categories publicly.            |
| CAT-006 | The system shall prevent deleting categories used by products. |

## 6.22.3 Category Fields

```txt
name
slug
description
parentId optional
icon optional
status
sortOrder
createdAt
updatedAt
```

## 6.22.4 Acceptance Criteria

```txt
Admins can create and update categories.
Only active categories appear in public filters.
Products cannot reference inactive or missing categories.
Category slugs are unique.
```

---

# 6.23 File Upload and Media Module

## 6.23.1 Description

The system shall manage image and attachment uploads for users, farms, shops, products, expenses, messages, and documents.

## 6.23.2 Functional Requirements

| ID       | Requirement                                                             |
| -------- | ----------------------------------------------------------------------- |
| MEDIA-001 | The system shall allow authenticated users to upload permitted files.  |
| MEDIA-002 | The system shall validate file type, size, and extension.              |
| MEDIA-003 | The system shall store media metadata after upload.                    |
| MEDIA-004 | The system shall support local development storage.                    |
| MEDIA-005 | The system shall support Cloudinary or equivalent production storage.  |
| MEDIA-006 | The system shall allow users to delete media they own when not in use. |
| MEDIA-007 | The system shall generate stable public URLs for public images.        |

## 6.23.3 Allowed Media Types

```txt
image/jpeg
image/png
image/webp
application/pdf for receipts and verification documents
```

## 6.23.4 Acceptance Criteria

```txt
Invalid file types are rejected.
Oversized files are rejected.
Uploaded product images can be displayed publicly.
Receipt files are visible only to authorized owners and admins.
```

---

# 6.24 Reports Module

## 6.24.1 Description

The reports module shall aggregate operational and financial information for farmers, shopkeepers, admins, and platform owners.

## 6.24.2 Functional Requirements

| ID      | Requirement                                                          |
| ------- | -------------------------------------------------------------------- |
| REP-001 | The system shall generate farmer batch performance reports.          |
| REP-002 | The system shall generate farmer profit and loss reports.            |
| REP-003 | The system shall generate shop sales and stock reports.              |
| REP-004 | The system shall generate admin platform activity reports.           |
| REP-005 | The system shall support date range filters for reports.             |
| REP-006 | The system shall support CSV export for key reports.                 |
| REP-007 | The system shall calculate metrics on the server.                    |
| REP-008 | The system shall restrict report data by ownership and user role.    |

## 6.24.3 Acceptance Criteria

```txt
Farmers only see reports for their farms.
Shopkeepers only see reports for their shops.
Admins can see platform-wide reports.
Report totals match underlying records.
```

---

# 6.25 Audit Log Module

## 6.25.1 Description

The system shall record sensitive business and administrative actions for accountability and troubleshooting.

## 6.25.2 Functional Requirements

| ID        | Requirement                                                         |
| --------- | ------------------------------------------------------------------- |
| AUDIT-001 | The system shall create audit logs for admin actions.               |
| AUDIT-002 | The system shall create audit logs for status changes.              |
| AUDIT-003 | The system shall store actor, action, entity type, and entity ID.   |
| AUDIT-004 | The system shall store before and after values when appropriate.    |
| AUDIT-005 | The system shall allow super admins to view audit logs.             |
| AUDIT-006 | The system shall prevent normal users from viewing audit logs.      |

## 6.25.3 Acceptance Criteria

```txt
Farm approval creates an audit log.
User suspension creates an audit log.
Order status changes create audit logs.
Audit logs cannot be modified through public APIs.
```

---

# 6.26 System Settings Module

## 6.26.1 Description

The system shall expose configurable settings for platform operations.

## 6.26.2 Functional Requirements

| ID       | Requirement                                                        |
| -------- | ------------------------------------------------------------------ |
| SET-001  | The system shall allow super admins to configure platform settings. |
| SET-002  | The system shall support default currency configuration.            |
| SET-003  | The system shall support platform commission configuration.         |
| SET-004  | The system shall support marketplace moderation settings.           |
| SET-005  | The system shall support payment provider configuration references. |
| SET-006  | The system shall not expose secret values to frontend clients.      |

## 6.26.3 Default Settings

```txt
currency = XAF
country = Cameroon
farmApprovalRequired = true
shopApprovalRequired = true
productApprovalRequired = true
defaultCommissionRate = 0
```

---

# 7. Non-Functional Requirements

## 7.1 Performance Requirements

```txt
Public pages should load in under 3 seconds on normal broadband.
Dashboard API calls should respond in under 1.5 seconds for normal data volume.
Marketplace search should support pagination.
Large lists must use server-side pagination.
Images must be optimized.
Database indexes must be used for common filters.
```

## 7.2 Security Requirements

```txt
Passwords must be hashed using bcrypt or argon2.
JWT tokens must expire.
Refresh tokens must be securely stored.
Input validation must be applied to all API endpoints.
File uploads must validate type and size.
Users must not access farms or shops they do not own.
Admin routes must require admin or super admin role.
Payment callbacks must be validated.
Rate limiting must be applied to authentication endpoints.
Audit logs must record sensitive admin actions.
```

## 7.3 Reliability Requirements

```txt
The system shall not lose farm records after creation.
The system shall handle payment failure gracefully.
The system shall validate all stock operations.
The system shall prevent double order processing.
The system shall prevent negative inventory.
```

## 7.4 Usability Requirements

```txt
The interface shall be simple for farmers.
The system shall use clear dashboard cards.
Forms shall include validation messages.
Mobile responsiveness is mandatory.
Critical actions shall require confirmation.
```

## 7.5 Scalability Requirements

```txt
The backend shall be modular.
The database shall use indexes.
The system shall support future microservices.
The system shall support future mobile app.
The system shall support future multi-language interface.
```

## 7.6 Availability Requirements

```txt
The system should be deployable on Ubuntu VPS.
The system should support PM2 process management.
The system should support Nginx reverse proxy.
The system should support SSL via Let’s Encrypt.
```

---

## 7.7 Data Privacy Requirements

```txt
Private user contact details shall not be exposed publicly without business need.
Customers shall not see seller financial reports.
Sellers shall not see customer payment provider response details.
Admins shall access private data only through protected admin routes.
The system shall support soft deletion for business-critical records.
The system shall retain audit logs even when related entities are soft deleted.
```

## 7.8 Localization Requirements

```txt
Default currency shall be XAF.
Default country shall be Cameroon.
The architecture shall allow English and French UI labels in future versions.
Dates shall be stored in UTC.
Frontend shall display dates using the user's locale where possible.
Phone number fields shall support Cameroon phone formats.
```

## 7.9 Accessibility Requirements

```txt
Interactive elements shall be keyboard accessible.
Form inputs shall have associated labels.
Color contrast shall be readable on light and dark interface areas.
Error messages shall not rely only on color.
Images that communicate meaning shall include alternative text.
```

## 7.10 Maintainability Requirements

```txt
Modules shall be separated by business domain.
Shared DTOs and enums should live in packages/shared where useful.
Backend controllers shall remain thin and delegate business logic to services.
Validation shall be centralized through DTOs or schemas.
Business calculations shall be unit tested.
Frontend API calls shall be organized through reusable service functions.
```

---

# 8. Recommended Technical Architecture

## 8.1 Architecture Type

Use a modular monolithic architecture for Version 1.

This is better than microservices for the first version because it is faster to build, easier to test, and easier for Codex to implement consistently.

## 8.2 Recommended Stack

```txt
Frontend: Next.js 15+ with App Router
Language: TypeScript
Styling: Tailwind CSS
UI Components: shadcn/ui
Animations: Framer Motion
Backend: NestJS or Express.js
Database: MongoDB
ODM: Mongoose
Authentication: JWT + Refresh Tokens
Real-time: Socket.IO
File Uploads: Cloudinary or local development storage
Validation: Zod or class-validator
State Management: Zustand or React Query
Deployment: Ubuntu VPS, Nginx, PM2
```

## 8.3 Preferred Implementation Option

For a clean professional build, use:

```txt
Next.js frontend
NestJS backend
MongoDB database
Socket.IO gateway
```

## 8.4 Repository Structure

Codex should create a monorepo:

```txt
poultryhub/
  apps/
    web/
    api/
  packages/
    shared/
  docs/
  docker/
  README.md
  .env.example
```

## 8.5 Frontend Structure

```txt
apps/web/
  src/
    app/
      page.tsx
      marketplace/
      farms/
      shops/
      auth/
      dashboard/
        customer/
        farmer/
        shopkeeper/
        admin/
    components/
      ui/
      layout/
      forms/
      cards/
      tables/
      charts/
    hooks/
    lib/
    services/
    types/
```

## 8.6 Backend Structure

```txt
apps/api/
  src/
    main.ts
    app.module.ts
    modules/
      auth/
      users/
      farms/
      batches/
      feeding/
      mortality/
      vaccination/
      egg-production/
      expenses/
      sales/
      shops/
      products/
      categories/
      cart/
      orders/
      payments/
      deliveries/
      notifications/
      messages/
      reviews/
      admin/
      reports/
    common/
      guards/
      decorators/
      filters/
      interceptors/
      pipes/
      utils/
    config/
```

---

# 9. Database Models

## 9.1 User Model

```ts
User {
  _id: ObjectId
  fullName: string
  email: string
  phone: string
  passwordHash: string
  avatar?: string
  address?: string
  city?: string
  region?: string
  country?: string
  roles: string[]
  status: "active" | "inactive" | "suspended"
  isVerified: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

## 9.2 Farm Model

```ts
Farm {
  _id: ObjectId
  ownerId: ObjectId
  name: string
  description?: string
  farmType: "broiler" | "layer" | "chick_production" | "egg_production" | "mixed_poultry" | "local_chicken"
  location: string
  city?: string
  region?: string
  country?: string
  coordinates?: {
    latitude: number
    longitude: number
  }
  phone?: string
  images: string[]
  verificationStatus: "pending" | "approved" | "rejected"
  rejectionReason?: string
  status: "active" | "inactive" | "suspended" | "deleted"
  createdAt: Date
  updatedAt: Date
}
```

## 9.3 Poultry Batch Model

```ts
PoultryBatch {
  _id: ObjectId
  farmId: ObjectId
  name: string
  batchCode: string
  poultryType: "broiler" | "layer" | "chick" | "cockerel" | "local" | "hybrid"
  breed?: string
  initialQuantity: number
  currentQuantity: number
  startDate: Date
  expectedMaturityDate?: Date
  status: "active" | "completed" | "sold" | "cancelled" | "lost"
  notes?: string
  createdAt: Date
  updatedAt: Date
}
```

## 9.4 Feeding Record Model

```ts
FeedingRecord {
  _id: ObjectId
  farmId: ObjectId
  batchId: ObjectId
  feedType: string
  quantity: number
  unit: "kg" | "bag" | "ton" | "other"
  cost: number
  feedingDate: Date
  recordedBy: ObjectId
  notes?: string
  createdAt: Date
  updatedAt: Date
}
```

## 9.5 Mortality Record Model

```ts
MortalityRecord {
  _id: ObjectId
  farmId: ObjectId
  batchId: ObjectId
  numberOfDeaths: number
  cause: string
  date: Date
  actionTaken?: string
  recordedBy: ObjectId
  notes?: string
  createdAt: Date
  updatedAt: Date
}
```

## 9.6 Vaccination Record Model

```ts
VaccinationRecord {
  _id: ObjectId
  farmId: ObjectId
  batchId: ObjectId
  vaccineName: string
  diseasePrevented?: string
  scheduledDate: Date
  completedDate?: Date
  status: "scheduled" | "completed" | "missed" | "cancelled"
  cost?: number
  administeredBy?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}
```

## 9.7 Egg Production Record Model

```ts
EggProductionRecord {
  _id: ObjectId
  farmId: ObjectId
  batchId: ObjectId
  date: Date
  eggsCollected: number
  damagedEggs: number
  eggsSold: number
  remainingEggs: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}
```

## 9.8 Expense Model

```ts
Expense {
  _id: ObjectId
  ownerId: ObjectId
  farmId?: ObjectId
  shopId?: ObjectId
  batchId?: ObjectId
  category: string
  amount: number
  date: Date
  description?: string
  receiptImage?: string
  createdAt: Date
  updatedAt: Date
}
```

## 9.9 Shop Model

```ts
Shop {
  _id: ObjectId
  ownerId: ObjectId
  name: string
  description?: string
  location: string
  city?: string
  region?: string
  country?: string
  phone?: string
  logo?: string
  images: string[]
  verificationStatus: "pending" | "approved" | "rejected"
  rejectionReason?: string
  status: "active" | "inactive" | "suspended" | "deleted"
  createdAt: Date
  updatedAt: Date
}
```

## 9.10 Product Model

```ts
Product {
  _id: ObjectId
  ownerId: ObjectId
  farmId?: ObjectId
  shopId?: ObjectId
  productType: "farm_product" | "shop_product"
  name: string
  description?: string
  categoryId: ObjectId
  price: number
  quantity: number
  unit: string
  images: string[]
  status: "available" | "out_of_stock" | "hidden"
  approvalStatus: "pending" | "approved" | "rejected"
  rejectionReason?: string
  createdAt: Date
  updatedAt: Date
}
```

## 9.11 Order Model

```ts
Order {
  _id: ObjectId
  customerId: ObjectId
  sellerId: ObjectId
  farmId?: ObjectId
  shopId?: ObjectId
  orderNumber: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  totalAmount: number
  paymentStatus: "unpaid" | "pending" | "paid" | "failed" | "refunded"
  orderStatus: "pending" | "confirmed" | "processing" | "ready" | "delivered" | "cancelled" | "rejected"
  deliveryMethod: string
  deliveryAddress?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}
```

## 9.12 Order Item

```ts
OrderItem {
  productId: ObjectId
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}
```

## 9.13 Payment Model

```ts
Payment {
  _id: ObjectId
  orderId: ObjectId
  userId: ObjectId
  amount: number
  currency: "XAF"
  paymentMethod: "cash_on_delivery" | "mtn_mobile_money" | "orange_money" | "bank_transfer" | "wallet"
  transactionReference?: string
  provider?: string
  status: "pending" | "paid" | "failed" | "refunded"
  providerResponse?: object
  paidAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

---

## 9.14 Farm Sale Model

```ts
FarmSale {
  _id: ObjectId
  farmId: ObjectId
  batchId?: ObjectId
  productType: "eggs" | "live_chicken" | "dressed_chicken" | "chicks" | "manure" | "spent_layers" | "other"
  quantity: number
  unit: string
  unitPrice: number
  totalAmount: number
  buyerName?: string
  paymentMethod: "cash" | "mobile_money" | "bank_transfer" | "credit" | "other"
  saleDate: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}
```

## 9.15 Cart Model

```ts
Cart {
  _id: ObjectId
  customerId: ObjectId
  items: CartItem[]
  subtotal: number
  createdAt: Date
  updatedAt: Date
}
```

## 9.16 Cart Item

```ts
CartItem {
  _id: ObjectId
  productId: ObjectId
  sellerId: ObjectId
  farmId?: ObjectId
  shopId?: ObjectId
  quantity: number
  unitPriceSnapshot: number
  productNameSnapshot: string
}
```

## 9.17 Category Model

```ts
Category {
  _id: ObjectId
  name: string
  slug: string
  description?: string
  parentId?: ObjectId
  icon?: string
  status: "active" | "inactive"
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}
```

## 9.18 Notification Model

```ts
Notification {
  _id: ObjectId
  userId: ObjectId
  type: string
  title: string
  body: string
  data?: object
  readAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

## 9.19 Conversation and Message Models

```ts
Conversation {
  _id: ObjectId
  participantIds: ObjectId[]
  subject?: string
  relatedOrderId?: ObjectId
  relatedFarmId?: ObjectId
  relatedShopId?: ObjectId
  lastMessageAt?: Date
  createdAt: Date
  updatedAt: Date
}

Message {
  _id: ObjectId
  conversationId: ObjectId
  senderId: ObjectId
  body: string
  attachments: string[]
  readBy: ObjectId[]
  createdAt: Date
  updatedAt: Date
}
```

## 9.20 Review Model

```ts
Review {
  _id: ObjectId
  customerId: ObjectId
  productId?: ObjectId
  farmId?: ObjectId
  shopId?: ObjectId
  orderId?: ObjectId
  rating: 1 | 2 | 3 | 4 | 5
  comment?: string
  status: "published" | "hidden" | "flagged"
  createdAt: Date
  updatedAt: Date
}
```

## 9.21 Audit Log Model

```ts
AuditLog {
  _id: ObjectId
  actorId: ObjectId
  actorRole: string
  action: string
  entityType: string
  entityId: ObjectId
  before?: object
  after?: object
  ipAddress?: string
  userAgent?: string
  createdAt: Date
}
```

## 9.22 Media Asset Model

```ts
MediaAsset {
  _id: ObjectId
  ownerId: ObjectId
  url: string
  publicId?: string
  storageProvider: "local" | "cloudinary" | "other"
  mimeType: string
  sizeBytes: number
  entityType?: string
  entityId?: ObjectId
  visibility: "public" | "private"
  createdAt: Date
  updatedAt: Date
}
```

## 9.23 Database Index Requirements

```txt
User.email unique
User.phone unique where phone is required
Farm.ownerId
Farm.verificationStatus + status
Shop.ownerId
Shop.verificationStatus + status
Product.categoryId
Product.productType
Product.approvalStatus + status
Product.name text index
Order.customerId
Order.sellerId
Order.orderNumber unique
Payment.orderId
Payment.transactionReference
PoultryBatch.farmId
FeedingRecord.batchId + feedingDate
MortalityRecord.batchId + date
VaccinationRecord.batchId + scheduledDate
EggProductionRecord.batchId + date
Notification.userId + readAt
AuditLog.actorId + createdAt
```

---

# 10. API Specification

## 10.1 Auth Endpoints

```txt
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/me
```

## 10.2 User Endpoints

```txt
GET    /api/users
GET    /api/users/:id
PATCH  /api/users/profile
PATCH  /api/users/:id/status
PATCH  /api/users/:id/roles
DELETE /api/users/:id
```

## 10.3 Farm Endpoints

```txt
POST   /api/farms
GET    /api/farms
GET    /api/farms/my
GET    /api/farms/:id
PATCH  /api/farms/:id
DELETE /api/farms/:id
PATCH  /api/farms/:id/approve
PATCH  /api/farms/:id/reject
PATCH  /api/farms/:id/suspend
```

## 10.4 Batch Endpoints

```txt
POST   /api/farms/:farmId/batches
GET    /api/farms/:farmId/batches
GET    /api/batches/:id
PATCH  /api/batches/:id
PATCH  /api/batches/:id/close
DELETE /api/batches/:id
```

## 10.5 Feeding Endpoints

```txt
POST   /api/batches/:batchId/feeding-records
GET    /api/batches/:batchId/feeding-records
PATCH  /api/feeding-records/:id
DELETE /api/feeding-records/:id
```

## 10.6 Mortality Endpoints

```txt
POST   /api/batches/:batchId/mortality-records
GET    /api/batches/:batchId/mortality-records
PATCH  /api/mortality-records/:id
DELETE /api/mortality-records/:id
```

## 10.7 Vaccination Endpoints

```txt
POST   /api/batches/:batchId/vaccination-records
GET    /api/batches/:batchId/vaccination-records
PATCH  /api/vaccination-records/:id
PATCH  /api/vaccination-records/:id/complete
DELETE /api/vaccination-records/:id
```

## 10.8 Egg Production Endpoints

```txt
POST   /api/batches/:batchId/egg-production-records
GET    /api/batches/:batchId/egg-production-records
PATCH  /api/egg-production-records/:id
DELETE /api/egg-production-records/:id
```

## 10.9 Shop Endpoints

```txt
POST   /api/shops
GET    /api/shops
GET    /api/shops/my
GET    /api/shops/:id
PATCH  /api/shops/:id
DELETE /api/shops/:id
PATCH  /api/shops/:id/approve
PATCH  /api/shops/:id/reject
PATCH  /api/shops/:id/suspend
```

## 10.10 Product Endpoints

```txt
POST   /api/products
GET    /api/products
GET    /api/products/my
GET    /api/products/:id
PATCH  /api/products/:id
DELETE /api/products/:id
PATCH  /api/products/:id/approve
PATCH  /api/products/:id/reject
PATCH  /api/products/:id/stock
```

## 10.11 Cart Endpoints

```txt
GET    /api/cart
POST   /api/cart/items
PATCH  /api/cart/items/:itemId
DELETE /api/cart/items/:itemId
DELETE /api/cart
```

## 10.12 Order Endpoints

```txt
POST   /api/orders
GET    /api/orders/my
GET    /api/orders/seller
GET    /api/orders/:id
PATCH  /api/orders/:id/status
PATCH  /api/orders/:id/cancel
```

## 10.13 Payment Endpoints

```txt
POST   /api/payments/initiate
POST   /api/payments/callback
GET    /api/payments/:id
GET    /api/payments/order/:orderId
```

## 10.14 Admin Endpoints

```txt
GET    /api/admin/dashboard
GET    /api/admin/reports/users
GET    /api/admin/reports/farms
GET    /api/admin/reports/shops
GET    /api/admin/reports/products
GET    /api/admin/reports/orders
GET    /api/admin/reports/revenue
```

---

## 10.15 Expense Endpoints

```txt
POST   /api/expenses
GET    /api/expenses
GET    /api/expenses/:id
PATCH  /api/expenses/:id
DELETE /api/expenses/:id
GET    /api/farms/:farmId/expenses
GET    /api/shops/:shopId/expenses
GET    /api/batches/:batchId/expenses
```

## 10.16 Farm Sale Endpoints

```txt
POST   /api/farm-sales
GET    /api/farm-sales
GET    /api/farm-sales/:id
PATCH  /api/farm-sales/:id
DELETE /api/farm-sales/:id
GET    /api/farms/:farmId/sales
GET    /api/batches/:batchId/sales
```

## 10.17 Category Endpoints

```txt
POST   /api/categories
GET    /api/categories
GET    /api/categories/tree
GET    /api/categories/:id
PATCH  /api/categories/:id
PATCH  /api/categories/:id/status
DELETE /api/categories/:id
```

## 10.18 Delivery Endpoints

```txt
GET    /api/deliveries/order/:orderId
PATCH  /api/deliveries/:id/status
PATCH  /api/orders/:orderId/delivery
```

## 10.19 Notification Endpoints

```txt
GET    /api/notifications
GET    /api/notifications/unread-count
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
DELETE /api/notifications/:id
```

## 10.20 Messaging Endpoints

```txt
POST   /api/conversations
GET    /api/conversations
GET    /api/conversations/:id
POST   /api/conversations/:id/messages
GET    /api/conversations/:id/messages
PATCH  /api/messages/:id/read
```

## 10.21 Review Endpoints

```txt
POST   /api/reviews
GET    /api/reviews/product/:productId
GET    /api/reviews/farm/:farmId
GET    /api/reviews/shop/:shopId
PATCH  /api/reviews/:id
DELETE /api/reviews/:id
PATCH  /api/admin/reviews/:id/status
```

## 10.22 Media Endpoints

```txt
POST   /api/media/upload
GET    /api/media/:id
DELETE /api/media/:id
```

## 10.23 Report Endpoints

```txt
GET    /api/reports/farmer/overview
GET    /api/reports/farmer/batches
GET    /api/reports/farmer/profit-loss
GET    /api/reports/shopkeeper/overview
GET    /api/reports/shopkeeper/sales
GET    /api/reports/shopkeeper/stock
GET    /api/reports/admin/overview
GET    /api/reports/admin/revenue
GET    /api/reports/admin/activity
```

## 10.24 Settings and Audit Endpoints

```txt
GET    /api/settings/public
GET    /api/admin/settings
PATCH  /api/admin/settings
GET    /api/admin/audit-logs
GET    /api/admin/audit-logs/:id
```

## 10.25 API Response Conventions

Successful single-resource responses shall use:

```json
{
  "data": {}
}
```

Successful list responses shall use:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

Error responses shall use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

## 10.26 Common Query Parameters

```txt
page
limit
sort
order
search
status
fromDate
toDate
categoryId
city
region
```

---

# 11. Frontend Page Requirements

## 11.1 Public Pages

```txt
/
 /about
 /marketplace
 /products/:id
 /farms
 /farms/:id
 /shops
 /shops/:id
 /login
 /register
 /contact
```

## 11.2 Customer Dashboard

```txt
/dashboard/customer
/dashboard/customer/orders
/dashboard/customer/orders/:id
/dashboard/customer/cart
/dashboard/customer/payments
/dashboard/customer/messages
/dashboard/customer/profile
```

## 11.3 Farmer Dashboard

```txt
/dashboard/farmer
/dashboard/farmer/farms
/dashboard/farmer/farms/create
/dashboard/farmer/farms/:id
/dashboard/farmer/farms/:id/batches
/dashboard/farmer/batches/:id
/dashboard/farmer/batches/:id/feeding
/dashboard/farmer/batches/:id/mortality
/dashboard/farmer/batches/:id/vaccination
/dashboard/farmer/batches/:id/egg-production
/dashboard/farmer/expenses
/dashboard/farmer/sales
/dashboard/farmer/products
/dashboard/farmer/reports
```

## 11.4 Shopkeeper Dashboard

```txt
/dashboard/shopkeeper
/dashboard/shopkeeper/shops
/dashboard/shopkeeper/shops/create
/dashboard/shopkeeper/shops/:id
/dashboard/shopkeeper/products
/dashboard/shopkeeper/products/create
/dashboard/shopkeeper/orders
/dashboard/shopkeeper/reports
```

## 11.5 Admin Dashboard

```txt
/dashboard/admin
/dashboard/admin/users
/dashboard/admin/farms
/dashboard/admin/shops
/dashboard/admin/products
/dashboard/admin/orders
/dashboard/admin/payments
/dashboard/admin/categories
/dashboard/admin/reports
/dashboard/admin/settings
```

---

# 12. UI/UX Requirements

## 12.1 Design Style

The platform should look:

```txt
modern
clean
agriculture-inspired
professional
mobile responsive
trustworthy
easy for non-technical farmers
```

## 12.2 Recommended Color Direction

```txt
green for agriculture
yellow/gold for eggs and poultry
white background for cleanliness
dark slate for professional text
```

## 12.3 Dashboard Cards

Every dashboard should use cards for:

```txt
total farms
total shops
total orders
total revenue
active batches
pending approvals
low stock
upcoming vaccinations
```

## 12.4 Forms

Forms shall include:

```txt
clear labels
required field indicators
validation errors
submit loading state
success messages
error messages
cancel buttons
```

---

## 12.5 Required UI States

Every major page and dashboard table shall include:

```txt
loading state
empty state
error state
success state after mutation
confirmation state for destructive actions
pagination state for long lists
mobile layout state
```

## 12.6 Dashboard Experience Requirements

Farmer dashboards shall prioritize operational farm work:

```txt
active batches
today's egg collection
recent mortality
upcoming vaccination
feed cost
farm sales
expenses
alerts
```

Shopkeeper dashboards shall prioritize commerce work:

```txt
pending orders
low stock
top products
recent sales
product approvals
customer reviews
```

Admin dashboards shall prioritize moderation and platform health:

```txt
pending farm approvals
pending shop approvals
pending product approvals
reported reviews
payment issues
user suspension actions
recent audit log events
```

## 12.7 Navigation Requirements

```txt
Visitors shall have access to public navigation for home, marketplace, farms, shops, login, and register.
Authenticated users shall have role-aware dashboard navigation.
Users with multiple roles shall be able to switch between role dashboards.
Admin navigation shall be hidden from non-admin users.
Mobile navigation shall support touch-friendly menu behavior.
```

---

# 13. Reports and Analytics

## 13.1 Farmer Reports

```txt
total birds
active batches
mortality rate
feed cost
vaccination cost
egg production
farm sales
farm expenses
estimated profit
batch performance
```

## 13.2 Shopkeeper Reports

```txt
total products
low-stock products
total orders
completed orders
cancelled orders
revenue
top-selling products
customer ratings
```

## 13.3 Admin Reports

```txt
total users
total farmers
total shopkeepers
total farms
total shops
total products
total orders
total platform revenue
pending approvals
most active regions
top categories
```

## 13.4 Key Calculations

```txt
currentBirds = initialQuantity - totalDeaths - totalBirdsSold

mortalityRate = totalDeaths / initialQuantity * 100

profit = totalSales - totalExpenses

eggProductionRate = eggsCollected / currentLayers * 100

averageRevenuePerBird = totalRevenue / birdsSold
```

---

# 14. Real-Time Requirements

Use Socket.IO.

## 14.1 Real-Time Events

```txt
order.created
order.updated
payment.updated
notification.created
message.sent
farm.approved
shop.approved
product.approved
vaccination.due
stock.low
```

## 14.2 Socket Rooms

```txt
user:{userId}
farm:{farmId}
shop:{shopId}
admin
order:{orderId}
```

---

# 15. Security and Access Control

## 15.1 Guards

The backend shall include:

```txt
JwtAuthGuard
RolesGuard
OwnershipGuard
AdminGuard
SuperAdminGuard
```

## 15.2 Ownership Checks

The system must verify ownership before allowing:

```txt
farm update
farm delete
batch creation
batch update
feeding record creation
mortality record creation
vaccination record creation
egg production record creation
shop update
product creation
product update
seller order processing
```

## 15.3 Audit Logs

The system shall record:

```txt
admin login
user suspension
farm approval
farm rejection
shop approval
shop rejection
product approval
product rejection
order status change
payment status change
role assignment
```

---

# 16. Testing Requirements

## 16.1 Unit Tests

Codex shall create unit tests for:

```txt
auth service
user service
farm service
shop service
product service
order service
payment service
batch service
mortality calculation
stock validation
```

## 16.2 Integration Tests

Codex shall create integration tests for:

```txt
registration and login
farm creation and approval
shop creation and approval
product creation and approval
cart checkout
order creation
payment status update
mortality update reducing batch quantity
```

## 16.3 End-to-End Tests

E2E tests should cover:

```txt
customer registration
farmer creates farm
admin approves farm
farmer creates batch
farmer publishes eggs
admin approves product
customer buys product
seller processes order
customer receives order
```

---

# 17. Environment Variables

Codex shall create `.env.example`.

```env
NODE_ENV=development
PORT=5000
APP_URL=http://localhost:3000
API_URL=http://localhost:5000

MONGODB_URI=mongodb://localhost:27017/poultryhub

JWT_ACCESS_SECRET=change_me
JWT_REFRESH_SECRET=change_me
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

PAYMENT_PROVIDER=
PAYMENT_API_KEY=
PAYMENT_SECRET=

SOCKET_CORS_ORIGIN=http://localhost:3000
```

---

# 18. Deployment Requirements

## 18.1 Production Server

The application shall be deployable on:

```txt
Ubuntu VPS
Nginx reverse proxy
PM2 process manager
MongoDB Atlas or self-hosted MongoDB
Let’s Encrypt SSL
```

## 18.2 Build Commands

Frontend:

```bash
npm run build
npm run start
```

Backend:

```bash
npm run build
npm run start:prod
```

## 18.3 Deployment Checklist

```txt
configure environment variables
install dependencies
build frontend
build backend
configure PM2
configure Nginx
enable SSL
test API health
test frontend routes
test authentication
test file uploads
test socket connection
```

---

# 19. Codex Build Instructions

Use the following as the **master prompt** for Codex.

## 19.1 Codex Master Prompt

```txt
You are building PoultryHub, a production-ready poultry farm management and marketplace platform.

Follow this SRS strictly.

Use a monorepo structure with:
- apps/web for the Next.js frontend
- apps/api for the NestJS backend
- packages/shared for shared TypeScript types

Technology requirements:
- Next.js with TypeScript and App Router
- Tailwind CSS
- shadcn/ui
- NestJS backend
- MongoDB with Mongoose
- JWT authentication with refresh tokens
- Role-based access control
- Socket.IO for real-time notifications and messaging
- Zod or class-validator for validation
- Clean modular architecture
- Production-quality error handling
- Pagination for list endpoints
- Ownership checks for farms, shops, products, batches, and orders
- Unit and integration tests

Build the project progressively in phases.

Phase 1:
Set up monorepo, frontend, backend, shared package, environment files, database connection, authentication, users, roles, and base layouts.

Phase 2:
Implement farm management, farm approval, shop management, shop approval, and admin dashboard basics.

Phase 3:
Implement poultry batch management, feeding records, mortality records, vaccination records, egg production records, expenses, and sales.

Phase 4:
Implement product management, categories, marketplace, cart, orders, and payment record tracking.

Phase 5:
Implement dashboards, analytics, reports, notifications, Socket.IO events, and messaging.

Phase 6:
Add tests, seed data, deployment documentation, and production hardening.

Important rules:
- Do not trust totals from the frontend.
- Always calculate order totals on the backend.
- Prevent negative product stock.
- Prevent mortality records greater than current batch quantity.
- Ensure users can only manage their own farms and shops.
- Admins can approve, reject, and suspend farms, shops, and products.
- Public marketplace should only show approved and available products.
- Use clean reusable components.
- Add loading, empty, and error states on frontend pages.
- Add README setup instructions.
```

---

# 20. Recommended Codex Task Breakdown

Because PoultryHub is a large product, implementation shall be divided into specific, reviewable tasks. Each task should produce a working slice that can be tested before the next phase begins.

## Task 1: Project Foundation

```txt
Create the PoultryHub monorepo with apps/web, apps/api, and packages/shared.
Set up Next.js, NestJS, TypeScript, Tailwind CSS, shadcn/ui, MongoDB configuration, shared types, linting, formatting, and README.
```

## Task 2: Authentication and Users

```txt
Implement authentication with register, login, refresh token, logout, me endpoint, password hashing, JWT guards, roles, users module, and profile update.
```

## Task 3: Farm and Shop Management

```txt
Implement farms and shops modules with CRUD, owner checks, approval workflow, rejection reason, suspension, public listing, and owner dashboard listing.
```

## Task 4: Poultry Batch Records

```txt
Implement poultry batches, feeding records, mortality records, vaccination records, egg production records, expenses, and farm sales. Ensure mortality updates current batch quantity safely.
```

## Task 5: Products and Marketplace

```txt
Implement categories, products, product approval, product stock management, marketplace listing, filters, product details, farm products, and shop products.
```

## Task 6: Cart, Orders, and Payments

```txt
Implement cart, order creation, seller order processing, backend total calculation, stock validation, payment records, payment status updates, and order status workflow.
```

## Task 7: Dashboards and Reports

```txt
Implement customer, farmer, shopkeeper, and admin dashboards with metrics, charts, recent activities, reports, and responsive UI.
```

## Task 8: Real-Time Notifications and Messaging

```txt
Implement Socket.IO gateway, notification module, user rooms, admin room, order notifications, payment notifications, message conversations, and unread counts.
```

## Task 9: Tests and Hardening

```txt
Add unit tests, integration tests, seed data, error handling, request validation, rate limiting, audit logs, deployment guide, and production security checklist.
```

---

# 21. MVP Definition

The first usable MVP must include:

```txt
authentication
multi-role users
farm creation
shop creation
admin approval
product creation
marketplace
cart
orders
basic payment tracking
batch management
feeding
mortality
vaccination
egg production
expenses
sales
farmer dashboard
shopkeeper dashboard
customer dashboard
admin dashboard
real-time notifications
```

---

# 22. Version 2 Features

After the MVP is stable, build:

```txt
AI poultry assistant
offline mode
React Native mobile app
WhatsApp notifications
QR farm verification
mobile money full integration
delivery partner module
inventory forecasting
disease alert system
French and English language support
```

---

# 23. Final Build Recommendation

For Codex, start with this exact first command:

```txt
Build Phase 1 of PoultryHub from the SRS. Create a production-ready monorepo with Next.js frontend, NestJS backend, MongoDB/Mongoose setup, shared TypeScript package, environment configuration, Tailwind CSS, shadcn/ui setup, authentication module skeleton, user module skeleton, and a professional README. Do not implement all modules yet. Prepare the architecture so later phases can be added cleanly.
```

Then continue phase by phase.

This SRS is detailed enough to guide Codex into building the platform professionally without losing structure.
