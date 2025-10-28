const express = require('express');
const router = express.Router();
const SoilSensorReading = require('../models/SoilSensorReading');

// 1. POST - إرسال قراءة جديدة
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    
    // Validation
    if (!data.deviceId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Device ID is required' 
      });
    }

    // إنشاء كائن القراءة
    const readingData = {
      deviceId: data.deviceId,
      deviceName: data.deviceName,
      location: data.location,
      farmName: data.farmName,
      cropType: data.cropType,
      depth: data.depth,
      notes: data.notes
    };

    // إضافة القراءات
    if (data.moisture !== undefined) {
      readingData.moisture = {
        value: data.moisture,
        unit: data.moistureUnit || '%'
      };
    }

    if (data.temperature !== undefined) {
      readingData.temperature = {
        value: data.temperature,
        unit: data.temperatureUnit || 'C'
      };
    }

    if (data.conductivity !== undefined) {
      readingData.conductivity = {
        value: data.conductivity,
        unit: data.conductivityUnit || 'µS/cm'
      };
    }

    if (data.pH !== undefined || data.ph !== undefined) {
      readingData.pH = {
        value: data.pH || data.ph
      };
    }

    if (data.nitrogen !== undefined) {
      readingData.nitrogen = {
        value: data.nitrogen,
        unit: data.nitrogenUnit || 'mg/kg'
      };
    }

    if (data.phosphorus !== undefined) {
      readingData.phosphorus = {
        value: data.phosphorus,
        unit: data.phosphorusUnit || 'mg/kg'
      };
    }

    if (data.potassium !== undefined) {
      readingData.potassium = {
        value: data.potassium,
        unit: data.potassiumUnit || 'mg/kg'
      };
    }

    if (data.salinity !== undefined) {
      readingData.salinity = {
        value: data.salinity,
        unit: data.salinityUnit || 'ppm'
      };
    }

    // معلومات البطارية
    if (data.batteryLevel || data.batteryVoltage) {
      readingData.battery = {
        level: data.batteryLevel,
        voltage: data.batteryVoltage
      };
    }

    // معلومات الاتصال
    if (data.rssi || data.signalStrength) {
      readingData.connection = {
        rssi: data.rssi,
        signalStrength: data.signalStrength
      };
    }

    // حفظ القراءة
    const reading = new SoilSensorReading(readingData);
    await reading.save();
    
    console.log(`🌱 New reading from ${data.deviceId}`);
    console.log(`   Soil Health: ${reading.soilHealth}`);
    if (reading.recommendations.length > 0) {
      console.log(`   ⚠️  Recommendations: ${reading.recommendations.length}`);
    }

    res.status(201).json({
      success: true,
      message: 'Reading saved successfully',
      data: {
        _id: reading._id,
        deviceId: reading.deviceId,
        soilHealth: reading.soilHealth,
        status: reading.status,
        readings: {
          moisture: reading.moisture,
          temperature: reading.temperature,
          conductivity: reading.conductivity,
          pH: reading.pH,
          nitrogen: reading.nitrogen,
          phosphorus: reading.phosphorus,
          potassium: reading.potassium,
          salinity: reading.salinity
        },
        npkRatio: reading.npkRatio,
        recommendations: reading.recommendations,
        timestamp: reading.timestamp
      }
    });

  } catch (error) {
    console.error('Error saving reading:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving reading',
      error: error.message
    });
  }
});

// 2. GET - جلب كل القراءات لجهاز معين
router.get('/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { 
      limit = 100, 
      status,
      soilHealth,
      startDate, 
      endDate,
      sort = 'desc' 
    } = req.query;

    const query = { deviceId };
    
    if (status) query.status = status;
    if (soilHealth) query.soilHealth = soilHealth;
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const readings = await SoilSensorReading
      .find(query)
      .sort({ timestamp: sort === 'asc' ? 1 : -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: readings.length,
      data: readings
    });

  } catch (error) {
    console.error('Error fetching readings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching readings',
      error: error.message
    });
  }
});

// 3. GET - جلب آخر قراءة
router.get('/:deviceId/latest', async (req, res) => {
  try {
    const { deviceId } = req.params;

    const reading = await SoilSensorReading
      .findOne({ deviceId })
      .sort({ timestamp: -1 });

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: 'No readings found for this device'
      });
    }

    res.json({
      success: true,
      data: reading
    });

  } catch (error) {
    console.error('Error fetching latest reading:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching latest reading',
      error: error.message
    });
  }
});

// 4. GET - جلب إحصائيات ومتوسطات
router.get('/:deviceId/stats', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { hours = 24 } = req.query;

    const stats = await SoilSensorReading.getAverages(deviceId, parseInt(hours));

    if (stats.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No data available for statistics'
      });
    }

    res.json({
      success: true,
      period: `Last ${hours} hours`,
      data: stats[0]
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// 5. GET - جلب التوصيات الحالية
router.get('/:deviceId/recommendations', async (req, res) => {
  try {
    const { deviceId } = req.params;

    const reading = await SoilSensorReading
      .findOne({ deviceId })
      .sort({ timestamp: -1 });

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: 'No readings found for this device'
      });
    }

    res.json({
      success: true,
      soilHealth: reading.soilHealth,
      recommendations: reading.recommendations,
      timestamp: reading.timestamp
    });

  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recommendations',
      error: error.message
    });
  }
});

// 6. GET - جلب القراءات الحرجة (Alerts)
router.get('/:deviceId/alerts', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { limit = 50 } = req.query;

    const readings = await SoilSensorReading
      .find({ 
        deviceId,
        $or: [
          { status: 'warning' },
          { status: 'critical' },
          { soilHealth: 'poor' },
          { soilHealth: 'critical' }
        ]
      })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: readings.length,
      data: readings.map(r => ({
        timestamp: r.timestamp,
        status: r.status,
        soilHealth: r.soilHealth,
        recommendations: r.recommendations,
        readings: {
          moisture: r.moisture,
          pH: r.pH,
          salinity: r.salinity,
          nitrogen: r.nitrogen
        }
      }))
    });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching alerts',
      error: error.message
    });
  }
});

// 7. GET - تحليل NPK
router.get('/:deviceId/npk-analysis', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { days = 7 } = req.query;
    
    const cutoffTime = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const readings = await SoilSensorReading
      .find({
        deviceId,
        timestamp: { $gte: cutoffTime },
        'nitrogen.value': { $ne: null },
        'phosphorus.value': { $ne: null },
        'potassium.value': { $ne: null }
      })
      .sort({ timestamp: 1 });

    const analysis = readings.map(r => ({
      timestamp: r.timestamp,
      nitrogen: r.nitrogen.value,
      phosphorus: r.phosphorus.value,
      potassium: r.potassium.value,
      npkRatio: r.npkRatio
    }));

    res.json({
      success: true,
      period: `Last ${days} days`,
      count: analysis.length,
      data: analysis
    });

  } catch (error) {
    console.error('Error fetching NPK analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching NPK analysis',
      error: error.message
    });
  }
});

// 8. DELETE - حذف قراءات قديمة
router.delete('/cleanup/:days', async (req, res) => {
  try {
    const days = parseInt(req.params.days);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await SoilSensorReading.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} old readings`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error cleaning up readings:', error);
    res.status(500).json({
      success: false,
      message: 'Error cleaning up readings',
      error: error.message
    });
  }
});

module.exports = router;