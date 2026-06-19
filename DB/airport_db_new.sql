drop index if exists AIRLINE_PK;
drop table if exists Airline cascade;

drop index if exists INCLUDE_FK;
drop index if exists BAGGAGE_PK;
drop table if exists Baggage cascade;

drop index if exists CHECK_FK;
drop index if exists GIVE_FK;
drop index if exists GENERATE_FK;
drop index if exists BOARDING_PASS_PK;
drop table if exists "Boarding Pass" cascade;

drop index if exists HAVE_FK;
drop index if exists CONTAIN_FK;
drop index if exists BOOKING_PK;
drop table if exists Booking cascade;

drop index if exists CONTROL_SERVICE_PK;
drop table if exists "Control Service" cascade;

drop index if exists ASSIGNED_TO_FK;
drop index if exists EXECUTE_FK;
drop index if exists FLIGHT_PK;
drop table if exists Flight cascade;

drop index if exists PASSENGER_PK;
drop table if exists Passenger cascade;

drop index if exists PLANE_PK;
drop table if exists Plane cascade;

drop index if exists REGISTRATION_AGENT_PK;
drop table if exists "Registration Agent" cascade;

drop index if exists IDENTIFY_CONTROLLER_FK;
drop index if exists IDENTIFY_AGENT_FK;
drop index if exists IDENTIFY_USER_FK;
drop index if exists USERS_PK;
drop table if exists Users cascade;

/*==============================================================*/
/* Table: Airline                                               */
/*==============================================================*/
create table Airline (
   airline_code         VARCHAR(20)          not null,
   airline_name         VARCHAR(20)          not null,
   airline_id           SERIAL               not null,
   constraint PK_AIRLINE primary key (airline_id)
);

/*==============================================================*/
/* Index: AIRLINE_PK                                            */
/*==============================================================*/
create unique index AIRLINE_PK on Airline (
airline_id
);

/*==============================================================*/
/* Table: Baggage                                               */
/*==============================================================*/
create table Baggage (
   baggage_id           SERIAL               not null,
   booking_id           INT4                 not null,    
   boarding_pass_id     INT4                 not null,    
   baggage_weight       NUMERIC(6,2)         not null,
   tag_number           VARCHAR(50)          not null,
   constraint PK_BAGGAGE primary key (baggage_id)
);

/*==============================================================*/
/* Index: BAGGAGE_PK                                            */
/*==============================================================*/
create unique index BAGGAGE_PK on Baggage (
baggage_id
);

/*==============================================================*/
/* Index: INCLUDE_FK                                            */
/*==============================================================*/
create index INCLUDE_FK on Baggage (
booking_id,
boarding_pass_id
);

/*==============================================================*/
/* Table: "Boarding Pass"                                       */
/*==============================================================*/
create table "Boarding Pass" (
   booking_id           INT4                 not null,
   boarding_pass_id     SERIAL               not null,
   agent_id             INT4                 not null,
   controller_id        INT4                 null,
   gate_number          VARCHAR(20)          not null,
   seat_number          VARCHAR(10)          not null,
   boarding_time        TIMESTAMP            null,
   boarding_pass_number VARCHAR(6)           null,
   constraint "PK_BOARDING PASS" primary key (booking_id, boarding_pass_id)
);

/*==============================================================*/
/* Index: BOARDING_PASS_PK                                      */
/*==============================================================*/
create unique index BOARDING_PASS_PK on "Boarding Pass" (
booking_id,
boarding_pass_id
);

/*==============================================================*/
/* Index: GIVE_FK                                               */
/*==============================================================*/
create index GIVE_FK on "Boarding Pass" (
agent_id
);

/*==============================================================*/
/* Index: CHECK_FK                                              */
/*==============================================================*/
create index CHECK_FK on "Boarding Pass" (
controller_id
);

/*==============================================================*/
/* Index: BOARDING_PASS_NUMBER_AK (человекочитаемый номер талона) */
/*==============================================================*/
create unique index BOARDING_PASS_NUMBER_AK on "Boarding Pass" (
boarding_pass_number
);

/*==============================================================*/
/* Table: Booking                                               */
/*==============================================================*/
create table Booking (
   booking_id           SERIAL               not null,
   flight_id            INT4                 not null,
   passenger_id         INT4                 not null,
   ticket_number        VARCHAR(50)          not null,
   booking_status       VARCHAR(25)          not null,
   constraint PK_BOOKING primary key (booking_id)
);

/*==============================================================*/
/* Index: BOOKING_PK                                            */
/*==============================================================*/
create unique index BOOKING_PK on Booking (
booking_id
);

/*==============================================================*/
/* Index: CONTAIN_FK                                            */
/*==============================================================*/
create index CONTAIN_FK on Booking (
flight_id
);

/*==============================================================*/
/* Index: HAVE_FK                                               */
/*==============================================================*/
create index HAVE_FK on Booking (
passenger_id
);

/*==============================================================*/
/* Table: "Control Service"                                     */
/*==============================================================*/
create table "Control Service" (
   controller_id        SERIAL               not null,
   controller_fullname  VARCHAR(50)          not null,
   controller_post      VARCHAR(50)          not null,
   constraint "PK_CONTROL SERVICE" primary key (controller_id)
);

/*==============================================================*/
/* Index: CONTROL_SERVICE_PK                                    */
/*==============================================================*/
create unique index CONTROL_SERVICE_PK on "Control Service" (
controller_id
);

/*==============================================================*/
/* Table: Flight                                                */
/*==============================================================*/
create table Flight (
   flight_id            SERIAL               not null,
   airline_id           INT4                 not null,
   plane_id             INT4                 not null,
   flight_number        VARCHAR(50)          not null,
   departure_datetime   TIMESTAMP            not null,
   departure_location   VARCHAR(100)         not null,
   destination_location VARCHAR(100)         not null,
   constraint PK_FLIGHT primary key (flight_id)
);

/*==============================================================*/
/* Index: FLIGHT_PK                                             */
/*==============================================================*/
create unique index FLIGHT_PK on Flight (
flight_id
);

/*==============================================================*/
/* Index: EXECUTE_FK                                            */
/*==============================================================*/
create index EXECUTE_FK on Flight (
airline_id
);

/*==============================================================*/
/* Index: ASSIGNED_TO_FK                                        */
/*==============================================================*/
create index ASSIGNED_TO_FK on Flight (
plane_id
);

/*==============================================================*/
/* Index: idx_flight_number (вторичный индекс для поиска рейса)  */
/*==============================================================*/
create index idx_flight_number on Flight (
flight_number
);

/*==============================================================*/
/* Table: Passenger                                             */
/*==============================================================*/
create table Passenger (
   passenger_id         SERIAL               not null,
   passenger_passport   VARCHAR(10)          not null,
   passenger_fullname   VARCHAR(50)          not null,
   constraint PK_PASSENGER primary key (passenger_id)
);

/*==============================================================*/
/* Index: PASSENGER_PK                                          */
/*==============================================================*/
create unique index PASSENGER_PK on Passenger (
passenger_id
);

/*==============================================================*/
/* Index: idx_passenger_passport (вторичный индекс по паспорту)  */
/*==============================================================*/
create index idx_passenger_passport on Passenger (
passenger_passport
);

/*==============================================================*/
/* Table: Plane                                                 */
/*==============================================================*/
create table Plane (
   plane_id             SERIAL               not null,
   plane_type           VARCHAR(25)          not null,
   plane_capacity       INT4                 not null,
   constraint PK_PLANE primary key (plane_id)
);

/*==============================================================*/
/* Index: PLANE_PK                                              */
/*==============================================================*/
create unique index PLANE_PK on Plane (
plane_id
);

/*==============================================================*/
/* Table: "Registration Agent"                                  */
/*==============================================================*/
create table "Registration Agent" (
   agent_id             SERIAL               not null,
   agent_fullname       VARCHAR(50)          not null,
   agent_post           VARCHAR(20)          not null,
   constraint "PK_REGISTRATION AGENT" primary key (agent_id)
);

/*==============================================================*/
/* Index: REGISTRATION_AGENT_PK                                 */
/*==============================================================*/
create unique index REGISTRATION_AGENT_PK on "Registration Agent" (
agent_id
);

/*==============================================================*/
/* Table: Users                                                 */
/*==============================================================*/
create table Users (
   user_id              SERIAL               not null,
   passenger_id         INT4                 null,
   agent_id             INT4                 null,
   controller_id        INT4                 null,
   user_login           VARCHAR(50)          not null,
   user_password        VARCHAR(255)         not null,
   user_role            VARCHAR(20)          not null,
   is_active            BOOL                 not null default true,
   created_at           TIMESTAMP            not null default now(),
   constraint PK_USERS primary key (user_id)
);

/*==============================================================*/
/* Index: USERS_PK                                              */
/*==============================================================*/
create unique index USERS_PK on Users (
user_id
);

/*==============================================================*/
/* Index: IDENTIFY_USER_FK                                      */
/*==============================================================*/
create index IDENTIFY_USER_FK on Users (
passenger_id
);

/*==============================================================*/
/* Index: IDENTIFY_AGENT_FK                                     */
/*==============================================================*/
create index IDENTIFY_AGENT_FK on Users (
agent_id
);

/*==============================================================*/
/* Index: IDENTIFY_CONTROLLER_FK                                */
/*==============================================================*/
create index IDENTIFY_CONTROLLER_FK on Users (
controller_id
);

/*==============================================================*/
/* Foreign Keys                                                 */
/*==============================================================*/

alter table Baggage
   add constraint FK_BAGGAGE_INCLUDE_BOARDING foreign key (booking_id, boarding_pass_id)
      references "Boarding Pass" (booking_id, boarding_pass_id)
      on delete cascade on update restrict;

alter table "Boarding Pass"
   add constraint FK_BOARDING_CHECK_CONTROL foreign key (controller_id)
      references "Control Service" (controller_id)
      on delete set null on update restrict;

alter table "Boarding Pass"
   add constraint FK_BOARDING_GENERATE_BOOKING foreign key (booking_id)
      references Booking (booking_id)
      on delete cascade on update restrict;

alter table "Boarding Pass"
   add constraint FK_BOARDING_GIVE_REGISTRA foreign key (agent_id)
      references "Registration Agent" (agent_id)
      on delete restrict on update restrict;

alter table Booking
   add constraint FK_BOOKING_CONTAIN_FLIGHT foreign key (flight_id)
      references Flight (flight_id)
      on delete restrict on update restrict;

alter table Booking
   add constraint FK_BOOKING_HAVE_PASSENGE foreign key (passenger_id)
      references Passenger (passenger_id)
      on delete restrict on update restrict;

alter table Flight
   add constraint "FK_FLIGHT_ASSIGNED_PLANE" foreign key (plane_id)
      references Plane (plane_id)
      on delete restrict on update restrict;

alter table Flight
   add constraint FK_FLIGHT_EXECUTE_AIRLINE foreign key (airline_id)
      references Airline (airline_id)
      on delete restrict on update restrict;

alter table Users
   add constraint FK_USERS_IDENTIFY__REGISTRA foreign key (agent_id)
      references "Registration Agent" (agent_id)
      on delete cascade on update restrict;

alter table Users
   add constraint FK_USERS_IDENTIFY__CONTROL foreign key (controller_id)
      references "Control Service" (controller_id)
      on delete cascade on update restrict;

alter table Users
   add constraint FK_USERS_IDENTIFY__PASSENGE foreign key (passenger_id)
      references Passenger (passenger_id)
      on delete cascade on update restrict;

/*==============================================================*/
/* Additional constraints                                       */
/*==============================================================*/

alter table Users
   add constraint UQ_USER_LOGIN unique (user_login);

alter table Users
   add constraint CHK_USER_ROLE check (user_role in ('admin', 'agent', 'controller', 'passenger'));

alter table Users
   add constraint CHK_USER_TYPE check (
      (passenger_id is not null and agent_id is null and controller_id is null) or
      (agent_id is not null and passenger_id is null and controller_id is null) or
      (controller_id is not null and passenger_id is null and agent_id is null) or
      (user_role = 'admin' and passenger_id is null and agent_id is null and controller_id is null)
   );
