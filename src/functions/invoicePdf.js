const PDFDocument = require("pdfkit");

function generateInvoicePdf(order) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      let buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text(`Invoice: ${order.code}`, { align: "center" });

      doc.moveDown(0.5);

      const tableTop = doc.y;
      const columnWidth = 140;
      const priceWidth = 80;
      const quantityWidth = 60;
      const totalWidth = 80;

      doc
        .lineWidth(0.5)
        .moveTo(50, tableTop)
        .lineTo(
          50 + columnWidth + priceWidth + quantityWidth + totalWidth,
          tableTop
        )
        .stroke();

      doc
        .fontSize(12)
        .font("Helvetica")
        .moveDown(1)
        .text(`Username: ${order.username}`)
        .text(`Email: ${order.email}`)
        .moveDown();

      doc
        .text(`Total Amount: Rs. ${order.totalAmount}`, { continued: true })
        .text(`Delivery Charge: Rs. ${order.deliveryCharge}`, {
          align: "right",
        })
        .moveDown();

      doc
        .text("Shipping Address:", { underline: true })
        .text(`${order.selectedAddress.name}`)
        .text(`${order.selectedAddress.address}`)
        .text(
          `${order.selectedAddress.city}, ${order.selectedAddress.state}, ${order.selectedAddress.pincode}`
        )
        .text(`Phone: ${order.selectedAddress.phone}`)
        .moveDown();

      // Items Table
      doc.fontSize(12).text("Items:", { underline: true }).moveDown();

      // Table Header (aligning column positions)
      const tableHeaderY = doc.y;
      doc
        .font("Helvetica-Bold")
        .text("Product Name", 50, tableHeaderY, {
          width: columnWidth,
          align: "left",
        })
        .text("Price", 50 + columnWidth, tableHeaderY, {
          width: priceWidth,
          align: "right",
        })
        .text("Quantity", 50 + columnWidth + priceWidth, tableHeaderY, {
          width: quantityWidth,
          align: "right",
        })
        .text(
          "Total",
          50 + columnWidth + priceWidth + quantityWidth,
          tableHeaderY,
          { width: totalWidth, align: "right" }
        )
        .moveDown();

      doc
        .lineWidth(0.5)
        .moveTo(50, doc.y)
        .lineTo(
          50 + columnWidth + priceWidth + quantityWidth + totalWidth,
          doc.y
        )
        .stroke()
        .moveDown();

      doc.font("Helvetica").fontSize(10);
      order.items.forEach((item) => {
        const itemTotal = item.saleprice * item.quantity;
        const itemY = doc.y;
        doc
          .moveDown()
          .text(item.productname, 50, itemY, {
            width: columnWidth,
            align: "left",
          })
          .text(`Rs. ${item.saleprice}`, 50 + columnWidth, itemY, {
            width: priceWidth,
            align: "right",
          })
          .text(item.quantity, 50 + columnWidth + priceWidth, itemY, {
            width: quantityWidth,
            align: "right",
          })
          .text(
            `Rs. ${itemTotal}`,
            50 + columnWidth + priceWidth + quantityWidth,
            itemY,
            { width: totalWidth, align: "right" }
          )
          .moveDown();
      });

      if (order.coupponUsed) {
        doc
          .moveDown()
          .text(`Coupon: ${order.coupponCode} - Rs. ${order.coupponDiscount}`, {
            align: "left",
          });
      }

      const totalAmount = order.totalAmount;
      doc
        .moveDown()
        .text(`Total Amount: Rs. ${totalAmount}`, { align: "right" });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = generateInvoicePdf;
