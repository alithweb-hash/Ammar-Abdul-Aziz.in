// tracker.js - نظام تتبع ملفات المشتركين (عبر Firebase)

// رابط قاعدة البيانات السحابية المستخرج من صورتك
const DB_URL = "https://dragon-gym-9f3d7-default-rtdb.firebaseio.com/profiles";

document.addEventListener("DOMContentLoaded", () => {
    // 1. إضافة زر "بروفايل المشترك" بجانب حقل الاسم
    const nameInput = document.getElementById('in_name');
    if (!nameInput) return; // التأكد من وجود الحقل
    
    const profileBtn = document.createElement('button');
    profileBtn.innerHTML = 'عرض بروفايل المشترك';
    profileBtn.style.cssText = 'margin-top: 10px; padding: 10px 15px; background: #1a237e; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; transition: 0.3s; width: 100%; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
    profileBtn.type = 'button';
    profileBtn.onmouseover = () => profileBtn.style.background = '#0d134a';
    profileBtn.onmouseout = () => profileBtn.style.background = '#1a237e';
    
    // إدراج الزر تحت حقل الاسم
    nameInput.parentNode.appendChild(profileBtn);
    
    // 2. إعداد نافذة منبثقة (Modal) لعرض البروفايل
    const modal = document.createElement('div');
    modal.id = 'profileModal';
    modal.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:99999; overflow-y:auto; padding:20px; box-sizing: border-box; backdrop-filter: blur(4px);';
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = 'background:white; max-width:900px; margin:20px auto; padding:30px; border-radius:12px; position:relative; min-height:300px; direction:rtl; box-shadow: 0 10px 25px rgba(0,0,0,0.2); font-family: "Cairo", sans-serif;';
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '❌ إغلاق البروفايل';
    closeBtn.style.cssText = 'position:absolute; top:20px; left:20px; background:#d32f2f; color:white; border:none; padding:8px 15px; border-radius:6px; cursor:pointer; font-weight:bold; font-size: 14px;';
    closeBtn.onclick = () => modal.style.display = 'none';
    
    const profileBody = document.createElement('div');
    profileBody.id = 'profileBody';
    
    modalContent.appendChild(closeBtn);
    modalContent.appendChild(profileBody);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // عند الضغط على زر البروفايل
    profileBtn.onclick = () => {
        const name = nameInput.value.trim();
        if(!name) {
            alert('يرجى إدخال اسم المشترك أولاً للبحث عن ملفه.');
            return;
        }
        showProfile(name);
    };

    // 3. حفظ البيانات تلقائياً عند الطباعة
    const printBtn = document.querySelector('.btn-print');
    if (printBtn) {
        // إضافة حدث إضافي لزر الطباعة دون مسح الحدث الأصلي
        printBtn.addEventListener('click', async () => {
            const name = nameInput.value.trim();
            if(!name) return; // إذا لم يوجد اسم لا تحفظ كبروفايل
            
            const date = document.getElementById('in_date').value;
            const dateTo = document.getElementById('in_date_to').value;
            const age = document.getElementById('in_age').value;
            const weight = document.getElementById('in_weight').value;
            const height = document.getElementById('in_height').value;
            const notes = document.getElementById('in_notes').value; // الغذاء والملاحظات
            
            let courseDays = [];
            const daysContainer = document.getElementById('in_days_container');
            const dayCards = daysContainer.querySelectorAll('.day-card');
            
            dayCards.forEach((card) => {
                let dayExercises = [];
                const inputs = card.querySelectorAll('input');
                inputs.forEach(input => {
                    if(input.value.trim()) {
                        dayExercises.push(input.value.trim());
                    }
                });
                if(dayExercises.length > 0) {
                    courseDays.push({
                        dayTitle: card.querySelector('h3').innerText,
                        exercises: dayExercises
                    });
                }
            });
            
            const record = {
                id: Date.now(), // معرف فريد
                date,
                dateTo,
                age,
                weight,
                height,
                notes,
                courseDays,
                timestamp: new Date().toLocaleDateString('ar-EG') + ' ' + new Date().toLocaleTimeString('ar-EG')
            };
            
            try {
                // إرسال البيانات إلى Firebase
                // نستخدم اسم المشترك كمسار (مجلد) لكل شخص
                await fetch(`${DB_URL}/${name}.json`, {
                    method: 'POST', // إضافة سجل جديد تحت اسم المشترك
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(record)
                });
                console.log("تم حفظ كورس المشترك بنجاح:", name);
            } catch (error) {
                console.error("حدث خطأ أثناء الحفظ:", error);
            }
        });
    }

    // 4. دالة عرض البروفايل
    async function showProfile(name) {
        modal.style.display = 'block';
        profileBody.innerHTML = `
            <div style="text-align:center; padding:50px;">
                <h3 style="color:#1a237e;">⏳ جاري جلب ملف "${name}"...</h3>
            </div>
        `;
        
        try {
            // جلب البيانات من Firebase
            const response = await fetch(`${DB_URL}/${name}.json`);
            const data = await response.json();
            
            let records = [];
            if (data) {
                // تحويل كائن Firebase إلى مصفوفة
                records = Object.values(data);
            }
            
            if(records.length === 0) {
                profileBody.innerHTML = `
                    <h2 style="color:#1a237e; border-bottom:3px solid #1a237e; padding-bottom:10px;">ملف المشترك: ${name}</h2>
                    <div style="background:#fff3f3; color:#d32f2f; padding:20px; border-radius:8px; border:1px solid #ffcdd2; text-align:center; font-size:18px; margin-top:20px;">
                        لا توجد كورسات أو سجلات سابقة محفوظة لهذا المشترك.
                        <br><span style="font-size:14px; color:#555;">(يتم حفظ السجل تلقائياً عند طباعة كورس جديد)</span>
                    </div>`;
                return;
            }
            
            // ترتيب السجلات من الأحدث للأقدم
            records.sort((a,b) => b.id - a.id);
            
            let html = `<h2 style="color:#1a237e; border-bottom:3px solid #1a237e; padding-bottom:10px; margin-bottom:20px;">ملف المشترك: ${name} <span style="font-size:14px; color:#666;">(${records.length} كورسات مسجلة)</span></h2>`;
            
            records.forEach((rec) => {
                html += `
                <div style="border: 1px solid #e0e0e0; padding: 20px; margin-bottom: 20px; border-radius: 10px; background: #fafafa; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                    <div style="display:flex; justify-content: space-between; flex-wrap: wrap; border-bottom: 1px dashed #ccc; padding-bottom: 15px; margin-bottom: 15px;">
                        <h3 style="margin:0; color:#b38836;">📅 كورس: ${rec.date || 'غير محدد'} (إلى ${rec.dateTo || 'غير محدد'})</h3>
                        <span style="color:#888; font-size:12px;">وقت الحفظ: ${rec.timestamp}</span>
                    </div>
                    
                    <div style="display:flex; gap:15px; margin-bottom:15px; flex-wrap:wrap;">
                        <div style="background:#e8eaf6; padding:8px 15px; border-radius:20px; color:#1a237e; font-weight:bold; font-size:14px;">⚖️ الوزن: ${rec.weight || '--'} كغ</div>
                        <div style="background:#e8eaf6; padding:8px 15px; border-radius:20px; color:#1a237e; font-weight:bold; font-size:14px;">📏 الطول: ${rec.height || '--'} سم</div>
                        <div style="background:#e8eaf6; padding:8px 15px; border-radius:20px; color:#1a237e; font-weight:bold; font-size:14px;">🎂 العمر: ${rec.age || '--'}</div>
                    </div>
                    
                    ${rec.notes ? `
                    <div style="background:#e8f5e9; border:1px solid #c8e6c9; padding:15px; border-radius:8px; margin-bottom:15px; color:#2e7d32;">
                        <strong style="display:block; margin-bottom:5px;">🍏 ملاحظات وغذاء:</strong>
                        <div style="white-space: pre-wrap;">${rec.notes}</div>
                    </div>` : ''}
                    
                    <strong style="color:#333; margin-bottom:10px; display:inline-block;">💪 أيام التمرين:</strong>
                    <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap:15px;">
                `;
                
                if (rec.courseDays && rec.courseDays.length > 0) {
                    rec.courseDays.forEach(d => {
                        html += `
                        <div style="background:white; padding:12px; border:1px solid #e0e0e0; border-radius:6px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                            <strong style="color:#d32f2f; display:block; border-bottom:1px solid #eee; padding-bottom:5px; margin-bottom:8px;">${d.dayTitle}</strong>
                            <ul style="margin:0; padding-right:20px; font-size:14px; color:#444;">
                                ${d.exercises.map(ex => `<li style="margin-bottom:4px;">${ex}</li>`).join('')}
                            </ul>
                        </div>`;
                    });
                } else {
                    html += `<div style="color:#888; font-style:italic;">لم يتم تسجيل تمارين لهذا الكورس.</div>`;
                }
                
                html += `</div></div>`;
            });
            
            profileBody.innerHTML = html;
            
        } catch (error) {
            profileBody.innerHTML = `
                <div style="text-align:center; padding:50px; color:red;">
                    <h3>❌ حدث خطأ في الاتصال</h3>
                    <p>يرجى التأكد من اتصالك بالإنترنت.</p>
                </div>
            `;
            console.error("خطأ في القراءة:", error);
        }
    }
});
