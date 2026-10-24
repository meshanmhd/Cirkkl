import { Operation } from "./common";
import {
  signupOperation,
  loginOperation,
  logoutOperation,
  verifyOrgOtpOperation,
  meOperation,
} from "./auth";
import {
  listEventsOperation,
  getEventOperation,
  createEventOperation,
  updateEventOperation,
  deleteEventOperation,
  updateEventStatusOperation,
  listOrgEventsOperation,
} from "./events";
import {
  registerForEventOperation,
  acceptTeamInviteOperation,
  declineTeamInviteOperation,
  myTicketsOperation,
  myRegistrationOperation,
} from "./registrations";
import { createPaymentOperation } from "./payments";
import {
  getOrgEventRegistrationsOperation,
  approveRegistrationOperation,
  rejectRegistrationOperation,
  cancelRegistrationOperation,
  toggleAttendanceOperation,
  getEventRolesOperation,
  createEventRoleOperation,
  deleteEventRoleOperation,
  listMembersOperation,
  updateMemberRoleOperation,
  scanAttendanceOperation,
  confirmAttendanceOperation,
} from "./org";
import {
  listNotificationsOperation,
  markNotificationReadOperation,
  markAllNotificationsReadOperation,
  deleteNotificationOperation,
  unreadNotificationsCountOperation,
  streamNotificationsOperation,
} from "./notifications";
import {
  getProfileOperation,
  updateProfileOperation,
  updateAvatarOperation,
  searchCollegesOperation,
  searchByCklIdOperation,
} from "./profile";
import { requestUploadOperation } from "./uploads";

export const operations = [
  signupOperation,
  loginOperation,
  logoutOperation,
  verifyOrgOtpOperation,
  meOperation,
  listEventsOperation,
  getEventOperation,
  createEventOperation,
  updateEventOperation,
  deleteEventOperation,
  updateEventStatusOperation,
  listOrgEventsOperation,
  registerForEventOperation,
  acceptTeamInviteOperation,
  declineTeamInviteOperation,
  myTicketsOperation,
  myRegistrationOperation,
  createPaymentOperation,
  getOrgEventRegistrationsOperation,
  approveRegistrationOperation,
  rejectRegistrationOperation,
  cancelRegistrationOperation,
  toggleAttendanceOperation,
  getEventRolesOperation,
  createEventRoleOperation,
  deleteEventRoleOperation,
  listMembersOperation,
  updateMemberRoleOperation,
  scanAttendanceOperation,
  confirmAttendanceOperation,
  listNotificationsOperation,
  markNotificationReadOperation,
  markAllNotificationsReadOperation,
  deleteNotificationOperation,
  unreadNotificationsCountOperation,
  streamNotificationsOperation,
  getProfileOperation,
  updateProfileOperation,
  updateAvatarOperation,
  searchCollegesOperation,
  searchByCklIdOperation,
  requestUploadOperation,
] as const;

export const operationsMap: Record<string, Operation> = Object.fromEntries(
  operations.map((op) => [op.name, op])
);
