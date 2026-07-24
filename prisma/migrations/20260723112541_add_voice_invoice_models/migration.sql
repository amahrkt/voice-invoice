-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('OK', 'NOT_FOUND', 'AMBIGUOUS');

-- CreateTable
CREATE TABLE "Post" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "namaNormal" TEXT NOT NULL,
    "harga" INTEGER NOT NULL,
    "stok" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "nomorInvoice" TEXT NOT NULL,
    "tanggalWaktu" TIMESTAMP(3) NOT NULL,
    "transcript" TEXT NOT NULL,
    "totalKeseluruhan" INTEGER NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "productId" TEXT,
    "namaBarang" TEXT NOT NULL,
    "kuantitas" INTEGER NOT NULL,
    "hargaSatuan" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "status" "ItemStatus" NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceCounter" (
    "date" TEXT NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "InvoiceCounter_pkey" PRIMARY KEY ("date")
);

-- CreateIndex
CREATE INDEX "Product_namaNormal_idx" ON "Product"("namaNormal");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_nomorInvoice_key" ON "Invoice"("nomorInvoice");

-- CreateIndex
CREATE INDEX "Invoice_tanggalWaktu_idx" ON "Invoice"("tanggalWaktu");

-- CreateIndex
CREATE INDEX "Invoice_nomorInvoice_idx" ON "Invoice"("nomorInvoice");

-- CreateIndex
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
