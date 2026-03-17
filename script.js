// script.js

// المتغيرات العامة
let products = [];
let dollarRate = 545; // القيمة الافتراضية

// تحميل سعر الدولار من localStorage
function loadDollarRate() {
    const saved = localStorage.getItem('dollarRate');
    if (saved && !isNaN(parseFloat(saved))) {
        dollarRate = parseFloat(saved);
    }
    return dollarRate;
}

// حفظ سعر الدولار
function saveDollarRate(rate) {
    localStorage.setItem('dollarRate', rate);
    dollarRate = rate;
}

// تنسيق السعر
function formatPrice(price) {
    return Number(price).toFixed(2);
}

// حساب السعر بالدولار
function getDollarPrice(price) {
    return (price / dollarRate).toFixed(2);
}

// عرض إشعار نسخ
function showCopyNotification(text) {
    const notif = document.createElement('div');
    notif.className = 'copy-notification';
    notif.textContent = `تم النسخ: ${text} ✔`;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 2000);
}

// نسخ نص إلى الحافظة
function copyToClipboard(text, label = '') {
    navigator.clipboard.writeText(text).then(() => {
        showCopyNotification(label || text);
    }).catch(() => {
        alert('فشل النسخ');
    });
}

// تحميل المنتجات من JSON
async function loadProducts() {
    try {
        const response = await fetch('products.json');
        if (!response.ok) throw new Error('فشل تحميل المنتجات');
        products = await response.json();
        return products;
    } catch (error) {
        console.error(error);
        return [];
    }
}

// عرض المنتجات في الصفحة الرئيسية
function displayProducts(productsToShow) {
    const container = document.getElementById('productsContainer');
    if (!container) return;

    if (!productsToShow.length) {
        container.innerHTML = '<p class="no-results">لا توجد منتجات مطابقة</p>';
        return;
    }

    container.innerHTML = productsToShow.map(prod => {
        const img = prod.category_img || 'https://via.placeholder.com/300x160?text=No+Image';
        const priceNum = parseFloat(prod.price) || 0;
        return `
            <div class="product-card" data-id="${prod.id}">
                <img src="${img}" alt="${prod.name}" class="card-img" loading="lazy">
                <div class="card-content">
                    <h3>${prod.name}</h3>
                    <div class="card-price">
                        <span class="original-price">${formatPrice(priceNum)}</span>
                        <span class="dollar-price">$${getDollarPrice(priceNum)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // إضافة حدث النقر على البطاقة للذهاب إلى التفاصيل
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.id;
            window.location.href = `detail.html?id=${id}`;
        });
    });
}

// فلترة المنتجات حسب البحث
function filterProducts(searchTerm) {
    if (!searchTerm) return products;
    return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
}

// عرض صفحة التفاصيل
async function showProductDetail() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) {
        document.getElementById('productDetails').innerHTML = '<p>لم يتم تحديد منتج</p>';
        return;
    }

    const product = products.find(p => p.id == id);
    if (!product) {
        document.getElementById('productDetails').innerHTML = '<p>المنتج غير موجود</p>';
        return;
    }

    // تجهيز البيانات
    const img = product.category_img || 'https://via.placeholder.com/300x300?text=No+Image';
    const priceNum = parseFloat(product.price) || 0;
    const availableText = product.available ? 'متوفر' : 'غير متوفر';
    const availableClass = product.available ? 'available' : 'unavailable';

    // إنشاء حقول قابلة للنسخ
    const fields = [
        { label: 'ID', value: product.id },
        { label: 'الاسم', value: product.name },
        { label: 'السعر', value: formatPrice(priceNum) },
        { label: 'السعر بالدولار', value: `$${getDollarPrice(priceNum)}` },
        { label: 'المعاملات (params)', value: product.params ? product.params.join('، ') : '—' },
        { label: 'اسم التصنيف', value: product.category_name },
        { label: 'الحالة', value: availableText },
        { label: 'نوع المنتج', value: product.product_type },
        { label: 'parent_id', value: product.parent_id },
        { label: 'السعر الأساسي', value: product.base_price },
        { label: 'الحد الأدنى', value: product.qty_values?.min ?? '—' },
        { label: 'الحد الأقصى', value: product.qty_values?.max ?? '—' },
    ];

    // إضافة User ID إذا كان موجوداً ضمن params
    if (product.params && product.params.includes('User ID')) {
        fields.push({ label: 'User ID', value: '(يُطلب من المستخدم)' });
    }

    const fieldsHtml = fields.map(f => `
        <div class="field-item">
            <span class="label">${f.label}:</span>
            <span class="value">${f.value}</span>
            <button class="copy-btn" data-copy="${f.value}">نسخ</button>
        </div>
    `).join('');

    const html = `
        <div class="detail-header">
            <img src="${img}" alt="${product.name}" class="detail-img">
            <div class="detail-title">
                <h2>${product.name}</h2>
                <div class="detail-meta">
                    <span class="badge">#${product.id}</span>
                    <span class="badge ${availableClass}">${availableText}</span>
                </div>
            </div>
        </div>
        <div class="fields-grid">
            ${fieldsHtml}
        </div>
    `;

    document.getElementById('productDetails').innerHTML = html;

    // إضافة فعالية النسخ لكل زر
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const text = btn.dataset.copy;
            copyToClipboard(text, text);
        });
    });
}

// تهيئة الصفحة الرئيسية
async function initHome() {
    loadDollarRate();
    await loadProducts();
    displayProducts(products);

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const filtered = filterProducts(e.target.value);
            displayProducts(filtered);
        });
    }
}

// تهيئة صفحة التفاصيل
async function initDetail() {
    loadDollarRate();
    await loadProducts();
    showProductDetail();
}

// تهيئة صفحة الإعدادات
function initSettings() {
    const rateInput = document.getElementById('dollarRate');
    const saveBtn = document.getElementById('saveRate');
    const statusMsg = document.getElementById('rateStatus');

    if (rateInput && saveBtn) {
        // تحميل القيمة المحفوظة
        rateInput.value = loadDollarRate();

        saveBtn.addEventListener('click', () => {
            const newRate = parseFloat(rateInput.value);
            if (isNaN(newRate) || newRate <= 0) {
                statusMsg.textContent = 'الرجاء إدخال رقم صحيح';
                statusMsg.style.color = '#f87171';
                return;
            }
            saveDollarRate(newRate);
            statusMsg.textContent = 'تم الحفظ بنجاح ✓';
            statusMsg.style.color = '#4ade80';
            // يمكن إعادة تحميل الصفحة الرئيسية إذا كانت مفتوحة في تاب آخر، لكن ليس ضرورياً
        });
    }
}

// تشغيل الكود حسب الصفحة
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    if (path.includes('detail.html')) {
        initDetail();
    } else if (path.includes('settings.html')) {
        initSettings();
    } else {
        initHome(); // الصفحة الرئيسية أو أي صفحة أخرى
    }
});
