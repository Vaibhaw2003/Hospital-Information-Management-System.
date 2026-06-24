const { Patient, Doctor, Appointment, OpdRegistration, Billing, Medicine, Payment, sequelize } = require('../models');
const { Op } = require('sequelize');

// @desc    Get dashboard summary statistics and charts
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const totalPatients = await Patient.count();
    const totalDoctors = await Doctor.count({ where: { status: 'Active' } });
    
    const todayAppointments = await Appointment.count({
      where: { appointment_date: today }
    });

    const todayOpd = await OpdRegistration.count({
      where: { registration_date: today }
    });

    const pendingPaymentsCount = await Billing.count({
      where: {
        payment_status: {
          [Op.in]: ['Pending', 'PartiallyPaid']
        }
      }
    });

    const allBills = await Billing.findAll({
      where: {
        payment_status: {
          [Op.in]: ['Pending', 'PartiallyPaid']
        }
      },
      include: [{ model: Payment, as: 'payments', attributes: ['amount_paid'] }]
    });

    let outstandingRevenue = 0;
    allBills.forEach(bill => {
      const paidSum = bill.payments.reduce((sum, p) => sum + parseFloat(p.amount_paid), 0);
      outstandingRevenue += (parseFloat(bill.total_amount) - paidSum);
    });

    const lowStockAlerts = await Medicine.count({
      where: {
        quantity: {
          [Op.lte]: sequelize.col('min_stock_level')
        }
      }
    });

    const totalRevenueSum = await Payment.sum('amount_paid') || 0.00;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    const startRange = sixMonthsAgo.toISOString().split('T')[0];

    const monthlyPayments = await Payment.findAll({
      where: {
        payment_date: {
          [Op.gte]: startRange
        }
      },
      attributes: [
        [sequelize.fn('date_format', sequelize.col('payment_date'), '%Y-%m'), 'monthName'],
        [sequelize.fn('SUM', sequelize.col('amount_paid')), 'totalCollected']
      ],
      group: ['monthName'],
      order: [['monthName', 'ASC']]
    });

    const monthlyRevenueChart = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      const key = d.toISOString().substring(0, 7);
      
      const record = monthlyPayments.find(p => p.getDataValue('monthName') === key);
      const value = record ? parseFloat(record.getDataValue('totalCollected')) : 0.00;

      monthlyRevenueChart.push({
        month: label,
        revenue: value
      });
    }

    const deptVisits = await OpdRegistration.findAll({
      attributes: [
        [sequelize.col('department.name'), 'deptName'],
        [sequelize.fn('COUNT', sequelize.col('OpdRegistration.id')), 'visitCount']
      ],
      include: [{
        model: require('../models/Department'),
        as: 'department',
        attributes: []
      }],
      group: ['deptName', 'department.id'],
      raw: true
    });

    res.status(200).json({
      success: true,
      stats: {
        totalPatients,
        totalDoctors,
        todayAppointments,
        todayOpd,
        pendingPaymentsCount,
        outstandingRevenue: parseFloat(outstandingRevenue.toFixed(2)),
        lowStockAlerts,
        totalRevenue: parseFloat(parseFloat(totalRevenueSum).toFixed(2))
      },
      charts: {
        monthlyRevenue: monthlyRevenueChart,
        departmentVisits: deptVisits.map(d => ({
          name: d.deptName,
          value: parseInt(d.visitCount)
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
