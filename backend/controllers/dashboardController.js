const { Op, fn, col } = require('sequelize');

/**
 * All models come from req.dbModels (hospital-specific DB)
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const { Patient, Doctor, Appointment, OpdRegistration, Billing, Medicine, Payment, Department } = req.dbModels;
    const db = req.db;

    const today = new Date().toISOString().split('T')[0];

    const totalPatients = await Patient.count();
    const totalDoctors  = await Doctor.count({ where: { status: 'Active' } });

    const todayOpd = await OpdRegistration.count({
      where: { visit_date: today }
    });

    const pendingBillings = await Billing.findAll({
      where: { status: { [Op.in]: ['Pending', 'Partial'] } },
      include: [{ model: Payment, as: 'payments', attributes: ['amount'] }]
    });

    const pendingPaymentsCount = pendingBillings.length;
    let outstandingRevenue = 0;
    pendingBillings.forEach(bill => {
      const paid = bill.payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
      outstandingRevenue += (parseFloat(bill.total_amount || 0) - paid);
    });

    const lowStockAlerts = await Medicine.count({
      where: { status: 'Active' }
    }).then(async () => {
      const meds = await Medicine.findAll({ where: { status: 'Active' } });
      return meds.filter(m => m.quantity <= m.min_stock_level).length;
    });

    const totalRevenue = await Payment.sum('amount') || 0;

    // Monthly revenue for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    const startRange = sixMonthsAgo.toISOString().split('T')[0];

    const monthlyPayments = await Payment.findAll({
      where: { createdAt: { [Op.gte]: startRange } },
      attributes: [
        [fn('DATE_FORMAT', col('createdAt'), '%Y-%m'), 'monthKey'],
        [fn('SUM', col('amount')), 'total']
      ],
      group: ['monthKey'],
      order: [['monthKey', 'ASC']],
      raw: true
    });

    const monthlyRevenueChart = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      const key = d.toISOString().substring(0, 7);
      const record = monthlyPayments.find(p => p.monthKey === key);
      monthlyRevenueChart.push({ month: label, revenue: record ? parseFloat(record.total) : 0 });
    }

    // Department visits
    const deptVisits = await OpdRegistration.findAll({
      attributes: [
        [col('department.name'), 'deptName'],
        [fn('COUNT', col('OpdRegistration.id')), 'visitCount']
      ],
      include: [{ model: Department, as: 'department', attributes: [] }],
      group: ['deptName', 'department.id'],
      raw: true
    });

    res.status(200).json({
      success: true,
      stats: {
        totalPatients,
        totalDoctors,
        todayOpd,
        pendingPaymentsCount,
        outstandingRevenue: parseFloat(outstandingRevenue.toFixed(2)),
        lowStockAlerts,
        totalRevenue: parseFloat(parseFloat(totalRevenue).toFixed(2))
      },
      charts: {
        monthlyRevenue: monthlyRevenueChart,
        departmentVisits: deptVisits.map(d => ({ name: d.deptName || 'Unknown', value: parseInt(d.visitCount) })).filter(d => d.name)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
