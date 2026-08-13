var crypto = require("crypto");
var PDFDocument = require("pdfkit");
var Certificate = require("../models/certificate.cjs");

function randomCode(length) {
  var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  var result = "";
  var bytes = crypto.randomBytes(length);
  for (var i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

async function generateUniqueCertificateId() {
  var year = new Date().getFullYear();
  var attempt = 0;
  while (attempt < 10) {
    var candidate = "CERT-" + year + "-" + randomCode(6);
    var existing = await Certificate.findOne({ certificateId: candidate });
    if (!existing) {
      return candidate;
    }
    attempt++;
  }
  throw new Error("Could not generate a unique certificate ID, please try again");
}

async function generateUniqueVerificationCode() {
  var attempt = 0;
  while (attempt < 10) {
    var candidate = randomCode(10);
    var existing = await Certificate.findOne({ verificationCode: candidate });
    if (!existing) {
      return candidate;
    }
    attempt++;
  }
  throw new Error("Could not generate a unique verification code, please try again");
}

async function generateCertificate(req, res) {
  try {
    var studentName = req.body.studentName;
    var studentEmail = req.body.studentEmail;
    var courseName = req.body.courseName;
    var courseId = req.body.courseId || "";
    var batch = req.body.batch || "";
    var completionDate = req.body.completionDate;

    if (!studentName || !studentEmail || !courseName || !completionDate) {
      return res.status(400).json({
        success: false,
        message: "studentName, studentEmail, courseName and completionDate are required",
      });
    }

    var completionDateObj = new Date(completionDate);
    if (isNaN(completionDateObj.getTime())) {
      return res.status(400).json({ success: false, message: "completionDate is invalid" });
    }

    var certificateId = await generateUniqueCertificateId();
    var verificationCode = await generateUniqueVerificationCode();
    var newCertificate = new Certificate({
      certificateId: certificateId,
      verificationCode: verificationCode,
      studentName: studentName,
      studentEmail: studentEmail,
      courseName: courseName,
      courseId: courseId,
      batch: batch,
      completionDate: completionDateObj,
      issueDate: new Date(),
      status: "Valid",
      issuedByEmail: req.user ? req.user.email : "",
      issuedByName: req.user ? req.user.firstName : "",
    });

    await newCertificate.save();

    res.json({
      success: true,
      message: "Certificate generated successfully",
      certificate: newCertificate,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to generate certificate" });
  }
}

async function getAllCertificates(req, res) {
  try {
    var query = {};
    if (req.query.search) {
      var regex = new RegExp(req.query.search, "i");
      query.$or = [{ studentName: regex }, { studentEmail: regex }, { courseName: regex }, { certificateId: regex }];
    }
    if (req.query.status) {
      query.status = req.query.status;
    }

    var page = parseInt(req.query.page) || 1;
    var limit = parseInt(req.query.limit) || 10;
    var total = await Certificate.countDocuments(query);
    var certificates = await Certificate.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      certificates: certificates,
      total: total,
      totalPages: Math.ceil(total / limit) || 1,
      page: page,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch certificates" });
  }
}

async function getMyCertificates(req, res) {
  try {
    var certificates = await Certificate.find({ studentEmail: req.user.email }).sort({ createdAt: -1 });
    res.json({ success: true, certificates: certificates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch certificates" });
  }
}

async function verifyCertificate(req, res) {
  try {
    var code = req.params.code;
    if (!code) {
      return res.status(400).json({ success: false, message: "Certificate ID or verification code is required" });
    }

    var certificate = await Certificate.findOne({
      $or: [{ certificateId: code }, { verificationCode: code }],
    });

    if (!certificate) {
      return res.json({ success: true, valid: false, message: "No certificate found for the provided ID / code" });
    }

    res.json({
      success: true,
      valid: certificate.status === "Valid",
      message: certificate.status === "Valid" ? "Certificate is valid" : "This certificate has been revoked",
      certificate: {
        certificateId: certificate.certificateId,
        studentName: certificate.studentName,
        courseName: certificate.courseName,
        batch: certificate.batch,
        completionDate: certificate.completionDate,
        issueDate: certificate.issueDate,
        status: certificate.status,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to verify certificate" });
  }
}

async function updateCertificateStatus(req, res) {
  try {
    var status = req.body.status;
    if (status !== "Valid" && status !== "Revoked") {
      return res.status(400).json({ success: false, message: "status must be Valid or Revoked" });
    }
    var certificate = await Certificate.findOne({ certificateId: req.params.certificateId });
    if (!certificate) {
      return res.status(404).json({ success: false, message: "Certificate not found" });
    }
    certificate.status = status;
    await certificate.save();
    res.json({ success: true, message: "Certificate status updated", certificate: certificate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to update certificate status" });
  }
}

async function downloadCertificate(req, res) {
  try {
    var certificate = await Certificate.findOne({ certificateId: req.params.certificateId });
    if (!certificate) {
      return res.status(404).json({ success: false, message: "Certificate not found" });
    }

    var isOwner = req.user.email === certificate.studentEmail;
    var isStaff = req.user.role === "Admin" || req.user.role === "Trainer";
    if (!isOwner && !isStaff) {
      return res.status(403).json({ success: false, message: "Access denied. You do not have permission." });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=" + certificate.certificateId + ".pdf");
    var doc = new PDFDocument({ layout: "landscape", size: "A4", margin: 0 });
    doc.pipe(res);
    var pageWidth = doc.page.width;
    var pageHeight = doc.page.height;
    doc.rect(0, 0, pageWidth, pageHeight).fill("#f4f1ea");
    doc.rect(20, 20, pageWidth - 40, pageHeight - 40).lineWidth(3).stroke("#0a3d62");
    doc.rect(30, 30, pageWidth - 60, pageHeight - 60).lineWidth(1).stroke("#0a3d62");
    doc.fillColor("#0a3d62").fontSize(34).font("Helvetica-Bold");
    doc.text("CERTIFICATE OF COMPLETION", 0, 90, { align: "center" });
    doc.moveDown(1.5);
    doc.fillColor("#333333").fontSize(14).font("Helvetica");
    doc.text("This is to certify that", 0, doc.y, { align: "center" });
    doc.moveDown(0.5);
    doc.fillColor("#0a3d62").fontSize(28).font("Helvetica-Bold");
    doc.text(certificate.studentName, 0, doc.y, { align: "center" });
    doc.moveDown(0.5);
    doc.fillColor("#333333").fontSize(14).font("Helvetica");
    doc.text("has successfully completed the course", 0, doc.y, { align: "center" });
    doc.moveDown(0.5);
    doc.fillColor("#0a3d62").fontSize(22).font("Helvetica-Bold");
    doc.text(certificate.courseName, 0, doc.y, { align: "center" });
    doc.moveDown(1);
    var completionText = "Completion Date: " + certificate.completionDate.toDateString();
    var issueText = "Issue Date: " + certificate.issueDate.toDateString();
    doc.fillColor("#555555").fontSize(12).font("Helvetica");
    doc.text(completionText + "        " + issueText, 0, doc.y, { align: "center" });
    doc.moveDown(2);
    doc.fillColor("#555555").fontSize(11).font("Helvetica");
    doc.text("Certificate ID: " + certificate.certificateId, 0, doc.y, { align: "center" });
    doc.moveDown(0.3);
    doc.end();
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message || "Failed to download certificate" });
    }
  }
}

module.exports = {
  generateCertificate: generateCertificate,
  getAllCertificates: getAllCertificates,
  getMyCertificates: getMyCertificates,
  verifyCertificate: verifyCertificate,
  updateCertificateStatus: updateCertificateStatus,
  downloadCertificate: downloadCertificate,
};