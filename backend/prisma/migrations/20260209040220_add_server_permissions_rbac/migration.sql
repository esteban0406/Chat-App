-- CreateEnum
CREATE TYPE "ServerPermission" AS ENUM ('CREATE_CHANNEL', 'DELETE_CHANNEL', 'DELETE_SERVER', 'INVITE_MEMBER', 'REMOVE_MEMBER', 'MANAGE_ROLES');

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "permissions" "ServerPermission"[];
