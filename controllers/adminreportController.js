const pool = require("../config/db");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

// ✅ Helper: Generate Excel file and send as response
const sendExcel = async (res, headers, rows, filename) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Report");

    worksheet.columns = headers.map(h => ({ header: h, key: h.toLowerCase().replace(/ /g, "_") }));

    rows.forEach(r => worksheet.addRow(r));

    res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${filename}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
};

// ✅ Helper: Generate PDF file and send as response
const sendPDF = (res, title, headers, rows, filename) => {
    const doc = new PDFDocument({ margin: 30, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}.pdf`);
    doc.pipe(res);

    doc.fontSize(18).text(title, { align: "center" }).moveDown();
    doc.fontSize(12);

    // Table Header
    doc.text(headers.join(" | "), { underline: true });
    doc.moveDown(0.5);

    // Table Rows
    rows.forEach(r => {
        const values = headers.map(h => r[h.toLowerCase().replace(/ /g, "_")]);
        doc.text(values.join(" | "));
    });

    doc.end();
};

/* -------------------------
   Membership Report
------------------------- */
exports.getMembershipReport = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT member_id,
                   CONCAT(first_name, ' ', last_name) AS name,
                   CASE 
                       WHEN end_date >= CURDATE() THEN 'Active'
                       ELSE 'Expired'
                   END AS status,
                   end_date
            FROM members
            ORDER BY end_date ASC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Membership report error:", error);
        res.status(500).json({ success: false, message: "Error fetching membership report" });
    }
};

exports.exportMembershipExcel = async (req, res) => {
    const [rows] = await pool.query(`
        SELECT member_id AS "Member ID",
               CONCAT(first_name, ' ', last_name) AS "Name",
               CASE WHEN end_date >= CURDATE() THEN 'Active' ELSE 'Expired' END AS "Status",
               end_date AS "End Date"
        FROM members
    `);
    sendExcel(res, ["Member ID", "Name", "Status", "End Date"], rows, "membership_report");
};

exports.exportMembershipPDF = async (req, res) => {
    const [rows] = await pool.query(`
        SELECT member_id AS "Member ID",
               CONCAT(first_name, ' ', last_name) AS "Name",
               CASE WHEN end_date >= CURDATE() THEN 'Active' ELSE 'Expired' END AS "Status",
               end_date AS "End Date"
        FROM members
    `);
    sendPDF(res, "Membership Report", ["Member ID", "Name", "Status", "End Date"], rows, "membership_report");
};

/* -------------------------
   Payment Report
------------------------- */
exports.getPaymentReport = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.payment_id,
                   CONCAT(m.first_name, ' ', m.last_name) AS member_name,
                   p.amount_paid,
                   p.status,
                   p.payment_date
            FROM payment_history p
            JOIN members m ON p.member_id = m.member_id
            ORDER BY p.payment_date DESC
        `);

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Payment report error:", error);
        res.status(500).json({ success: false, message: "Error fetching payment report" });
    }
};

exports.exportPaymentExcel = async (req, res) => {
    const [rows] = await pool.query(`
        SELECT p.payment_id AS "Receipt ID",
               CONCAT(m.first_name, ' ', m.last_name) AS "Member",
               p.amount_paid AS "Amount",
               p.status AS "Status",
               p.payment_date AS "Date"
        FROM payment_history p
        JOIN members m ON p.member_id = m.member_id
    `);
    sendExcel(res, ["Receipt ID", "Member", "Amount", "Status", "Date"], rows, "payment_report");
};

exports.exportPaymentPDF = async (req, res) => {
    const [rows] = await pool.query(`
        SELECT p.payment_id AS "Receipt ID",
               CONCAT(m.first_name, ' ', m.last_name) AS "Member",
               p.amount_paid AS "Amount",
               p.status AS "Status",
               p.payment_date AS "Date"
        FROM payment_history p
        JOIN members m ON p.member_id = m.member_id
    `);
    sendPDF(res, "Payment Report", ["Receipt ID", "Member", "Amount", "Status", "Date"], rows, "payment_report");
};


/* -------------------------
   Attendance Report
------------------------- */
exports.getAttendanceReport = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT c.checkin_id AS attendance_id,
                   CONCAT(m.first_name, ' ', m.last_name) AS member_name,
                   DATE(c.checkin_time) AS date,
                   TIME(c.checkin_time) AS check_in_time,
                   TIME(c.checkout_time) AS check_out_time
            FROM checkins c
            JOIN members m ON c.member_id = m.member_id
            ORDER BY c.checkin_time DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Attendance report error:", error);
        res.status(500).json({ success: false, message: "Error fetching attendance report" });
    }
};

exports.exportAttendanceExcel = async (req, res) => {
    const [rows] = await pool.query(`
        SELECT c.checkin_id AS "Attendance ID",
               CONCAT(m.first_name, ' ', m.last_name) AS "Member",
               DATE(c.checkin_time) AS "Date",
               TIME(c.checkin_time) AS "Check-in Time",
               TIME(c.checkout_time) AS "Check-out Time"
        FROM checkins c
        JOIN members m ON c.member_id = m.member_id
    `);
    sendExcel(res, ["Attendance ID", "Member", "Date", "Check-in Time", "Check-out Time"], rows, "attendance_report");
};

exports.exportAttendancePDF = async (req, res) => {
    const [rows] = await pool.query(`
        SELECT c.checkin_id AS "Attendance ID",
               CONCAT(m.first_name, ' ', m.last_name) AS "Member",
               DATE(c.checkin_time) AS "Date",
               TIME(c.checkin_time) AS "Check-in Time",
               TIME(c.checkout_time) AS "Check-out Time"
        FROM checkins c
        JOIN members m ON c.member_id = m.member_id
    `);
    sendPDF(res, "Attendance Report", ["Attendance ID", "Member", "Date", "Check-in Time", "Check-out Time"], rows, "attendance_report");
};

