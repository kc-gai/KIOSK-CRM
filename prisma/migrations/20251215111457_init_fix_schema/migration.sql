-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Partner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "contact" TEXT,
    "address" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "contractDate" DATETIME,
    "commissionTerms" TEXT,
    "saleTerms" TEXT,
    "maintenanceTerms" TEXT,
    "feeChangeTerms" TEXT,
    "erpReflected" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Partner" ("address", "contact", "createdAt", "id", "name", "type", "updatedAt") SELECT "address", "contact", "createdAt", "id", "name", "type", "updatedAt" FROM "Partner";
DROP TABLE "Partner";
ALTER TABLE "new_Partner" RENAME TO "Partner";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
