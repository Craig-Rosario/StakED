import Class from "../models/Class.js";
import Exam from "../models/Exam.js"; 

export const getVerifierStats = async (req, res) => {
  try {
    const verifierId = req.user.userId;

    const totalClasses = await Class.countDocuments({ verifier: verifierId });

    let totalExams = 0;
    let pendingResults = 0;
    if (typeof Exam !== "undefined") {
      totalExams = await Exam.countDocuments({ verifier: verifierId });

      const pendingAgg = await Exam.aggregate([
        { $match: { verifier: verifierId } },
        { $group: { _id: null, totalPending: { $sum: "$pendingResults" } } }
      ]);
      pendingResults = pendingAgg[0]?.totalPending || 0;
    }

    return res.json({ totalClasses, totalExams, pendingResults });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch stats", error: err.message });
  }
};
