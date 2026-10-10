const express = require('express');
const app = express();

// التعديل الأول: السماح للمنصة باختيار البورت المناسب أو استخدام 3000 كبديل محلي
const PORT = process.env.PORT || 3000;

const path = require('path');

// السطر ده هو اللي هيخلي ملف الـ CSS يتقرأ
app.use(express.static(path.join(__dirname, 'views')));

// فتح ملف الـ HTML عند طلب المسار الرئيسي
// (التعديل التنظيمي: تم مسح التكرار لأنك كنتي كاتبة السطر ده مرتين)
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// التعديل الثاني: مسح الـ IP الداخلي (192.168.1.48) واستخدام 0.0.0.0 
// عشان السيرفر يقبل اتصالات من أي مكان على الإنترنت
const server = app.listen(PORT, '0.0.0.0', function(){
    console.log("Server is running on port " + PORT);
});

// إنشاء سيرفر الـ WebSocket فوق سيرفر الـ HTTP
const SocketServer = require('ws').Server;
const wss = new SocketServer({ server });

// القيمة الافتراضية لشدة الإضاءة (من 0 إلى 255)
let brightness_value = "0";

wss.on('connection', function(ws) {
    console.log('Client connected');
    
    // أول ما أي عميل يفتح (المتصفح أو الـ ESP)، نبعتله القيمة الحالية فوراً
    ws.send(brightness_value);

    // لما المتصفح يبعت رقم جديد من السلايدر
    ws.on('message', function(msg) {
        brightness_value = msg.toString();
        console.log("Brightness updated:", brightness_value);
        
        // إعادة إرسال القيمة لكل الأجهزة المتصلة
        broadcast(brightness_value);
    });
    
    ws.on('close', function() {
        console.log('Client disconnected');
    });
});

// دالة لتوزيع الرسالة على كل المتصلين المفتوحين
function broadcast(msg) {
    wss.clients.forEach(function(client) {
        if (client.readyState === client.OPEN) {
            client.send(msg);
        }
    });
}