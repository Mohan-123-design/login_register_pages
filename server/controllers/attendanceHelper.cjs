function calculateReportData(records) {
  var totalRecords = 0;
  var presentCount = 0;
  var absentCount = 0;
  var lateCount = 0;
  var totalDurationInMinutes = 0;
  for (var i = 0; i < records.length; i++) {
    var record = records[i];
    totalRecords = totalRecords + 1;
    if (record.status === "Present" || record.status === "present") {
      presentCount = presentCount + 1;
    } else if (record.status === "Absent" || record.status === "absent") {
      absentCount = absentCount + 1;
    } else if (record.status === "Late" || record.status === "late") {
      lateCount = lateCount + 1;
    }
    if (record.joinTime && record.leaveTime) {
      var joinTimeMs = new Date(record.joinTime).getTime();
      var leaveTimeMs = new Date(record.leaveTime).getTime();
      var differenceMs = leaveTimeMs - joinTimeMs;
      var minutes = differenceMs / (1000 * 60);
      totalDurationInMinutes = totalDurationInMinutes + minutes;
    }
  }
  var attendancePercentage = 0;
  if (totalRecords > 0) {
    attendancePercentage = (presentCount / totalRecords) * 100;
  }
  return {
    totalRecords: totalRecords,
    present: presentCount,
    absent: absentCount,
    late: lateCount,
    attendancePercentage: attendancePercentage,
    totalDurationInMinutes: totalDurationInMinutes,
  };
}
module.exports = {
  calculateReportData,
};
