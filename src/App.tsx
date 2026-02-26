import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import {
  Clipboard,
  Info,
  Target,
  MessageSquare,
  Palette,
  Upload,
  Check,
  Zap,
  FileText,
  Trash2,
  Plus,
  Sparkles,
  X,
  ExternalLink
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const LOGO_URL = "https://transitioneg.com/assets/logo/logo-icon.png";
const BRAND_PURPLE = "#A22675"; // rgb(162, 38, 117)
const BRAND_ORANGE = "#F29026"; // rgb(242, 144, 38)
const BRAND_MIX = "#CA5B4F";    // Midpoint mix

// --- Components ---

const Modal = ({ isOpen, onClose, children }: { isOpen: boolean, onClose: () => void, children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-8 sm:p-12 text-center overflow-hidden"
        >
          {children}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const AnimatedBackground = () => {
  const beams = Array.from({ length: 25 });
  const animationDuration = 45; // seconds

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-white">
      {/* Rainbow Beams */}
      {beams.map((_, i) => {
        const delay = -(i / beams.length) * animationDuration;
        const duration = animationDuration - (animationDuration / beams.length / 2) * i;

        const shadowColors = i % 2 === 0
          ? `${BRAND_PURPLE}, ${BRAND_MIX}, ${BRAND_ORANGE}`
          : `${BRAND_ORANGE}, ${BRAND_MIX}, ${BRAND_PURPLE}`;

        const colors = shadowColors.split(', ');

        return (
          <div
            key={i}
            className="rainbow-beam"
            style={{
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
              boxShadow: `
                -130px 0 80px 40px white, 
                -50px 0 50px 25px ${colors[0]},
                0 0 50px 25px ${colors[1]}, 
                50px 0 50px 25px ${colors[2]},
                130px 0 80px 40px white
              `
            }}
          />
        );
      })}

      {/* Vignettes for softness */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-full h-0 shadow-[0_0_50vh_40vh_rgba(255,255,255,1)]" />
        <div className="absolute bottom-0 left-0 w-0 h-full shadow-[0_0_35vw_25vw_rgba(255,255,255,1)]" />
      </div>
    </div>
  );
};

const GlassCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn("glass-card p-6 sm:p-12 relative overflow-hidden", className)}
  >
    {children}
  </motion.div>
);

const SectionTitle = ({ icon: Icon, title }: { icon: any, title: string }) => (
  <div className="flex items-center gap-4 mb-10 group">
    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-brand-purple/10 to-brand-orange/10 text-brand-purple group-hover:scale-110 transition-transform shadow-sm">
      <Icon size={26} strokeWidth={2.5} />
    </div>
    <h2 className="text-3xl font-black text-slate-800 tracking-tight">
      {title}
    </h2>
  </div>
);

const InputField = ({ label, name, type = "text", placeholder, value, onChange, required = false }: any) => (
  <div className="mb-8 w-full text-right" dir="rtl">
    <label className="block text-[15px] font-bold text-slate-700 mb-2.5 mr-1">
      {label} {required && <span className="text-brand-purple font-black">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-white/40 border border-slate-100 rounded-2xl px-6 py-5 focus:outline-none focus:ring-4 focus:ring-brand-purple/5 focus:border-brand-purple/20 transition-all text-slate-800 placeholder:text-slate-300 text-lg font-medium shadow-sm"
      required={required}
    />
  </div>
);

const TextAreaField = ({ label, name, placeholder, value, onChange, required = false }: any) => (
  <div className="mb-8 w-full text-right" dir="rtl">
    <label className="block text-[15px] font-bold text-slate-700 mb-2.5 mr-1">
      {label} {required && <span className="text-brand-purple font-black">*</span>}
    </label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={4}
      className="w-full bg-white/40 border border-slate-100 rounded-2xl px-6 py-5 focus:outline-none focus:ring-4 focus:ring-brand-purple/5 focus:border-brand-purple/20 transition-all text-slate-800 placeholder:text-slate-300 text-lg leading-relaxed resize-none font-medium shadow-sm"
      required={required}
    />
  </div>
);

const RadioGroup = ({ label, name, options, value, onChange }: any) => (
  <div className="mb-10 w-full text-right" dir="rtl">
    <label className="block text-[15px] font-bold text-slate-700 mb-5 mr-1">{label}</label>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {options.map((opt: any) => (
        <label
          key={opt.value}
          className={cn(
            "group flex items-center justify-between gap-4 px-8 py-5 rounded-2xl cursor-pointer transition-all border-2 text-lg font-black",
            value === opt.value
              ? "bg-white border-brand-purple text-brand-purple shadow-xl shadow-brand-purple/5"
              : "bg-white/40 border-slate-100 text-slate-400 hover:border-slate-200"
          )}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={onChange}
            className="hidden"
          />
          <span>{opt.label}</span>
          <div className={cn(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all group-hover:scale-110",
            value === opt.value ? "border-brand-purple bg-brand-purple" : "border-slate-200"
          )}>
            {value === opt.value && <Check size={14} strokeWidth={4} className="text-white" />}
          </div>
        </label>
      ))}
    </div>
  </div>
);

const CheckboxGroup = ({ label, options, selectedValues, onChange }: any) => (
  <div className="mb-10 w-full text-right" dir="rtl">
    <label className="block text-[15px] font-bold text-slate-700 mb-5 mr-1">{label}</label>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {options.map((opt: any) => (
        <label
          key={opt.value}
          className={cn(
            "flex flex-col items-center justify-center gap-3 px-4 py-8 rounded-2xl cursor-pointer transition-all border-2 text-center group",
            selectedValues.includes(opt.value)
              ? "bg-white border-brand-orange text-brand-orange shadow-xl shadow-brand-orange/5"
              : "bg-white/40 border-slate-100 text-slate-400 hover:border-slate-200"
          )}
        >
          <input
            type="checkbox"
            checked={selectedValues.includes(opt.value)}
            onChange={() => onChange(opt.value)}
            className="hidden"
          />
          <div className={cn(
            "p-3 rounded-xl transition-all group-hover:rotate-6",
            selectedValues.includes(opt.value) ? "bg-brand-orange text-white" : "bg-slate-50 text-slate-300"
          )}>
            <Sparkles size={24} />
          </div>
          <span className="font-black text-sm tracking-tight">{opt.label}</span>
        </label>
      ))}
    </div>
  </div>
);

// --- Pages ---

const AdminPage = () => {
  const [driveLink, setDriveLink] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    if (!driveLink) return;
    const encodedLink = btoa(driveLink);
    const baseUrl = window.location.origin;
    setGeneratedLink(`${baseUrl}/form?d=${encodedLink}`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6">
      <AnimatedBackground />
      <GlassCard className="max-w-2xl w-full">
        <div className="flex flex-col items-center mb-12">
          <motion.div
            whileHover={{ rotate: 5, scale: 1.05 }}
            className="p-6 rounded-[2.5rem] bg-white shadow-2xl shadow-brand-purple/5 mb-8 border border-slate-50"
          >
            <img src={LOGO_URL} alt="Logo" className="w-20 h-20 object-contain" />
          </motion.div>
          <h1 className="text-4xl font-black text-slate-800 text-center tracking-tight uppercase">Transition <span className="text-brand-purple">Brief Form</span></h1>
          <p className="text-slate-400 mt-3 text-lg font-medium text-center">Generate a secure link for your client's marketing briefing</p>
        </div>

        <div className="space-y-8">
          <InputField
            label="Google Drive Link"
            placeholder="Paste public folder link..."
            value={driveLink}
            onChange={(e: any) => setDriveLink(e.target.value)}
          />

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleGenerate}
            disabled={!driveLink}
            className="w-full py-6 bg-slate-900 text-white font-black rounded-[1.8rem] shadow-2xl disabled:opacity-30 transition-all text-xl uppercase tracking-[0.1em]"
          >
            Create Brief Link
          </motion.button>

          <AnimatePresence>
            {generatedLink && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-6"
              >
                <div className="p-8 bg-brand-purple/5 border border-brand-purple/10 rounded-[2.2rem]">
                  <p className="text-[11px] text-brand-purple font-black mb-4 uppercase tracking-[0.3em]">Access Link Ready:</p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input
                      readOnly
                      value={generatedLink}
                      className="flex-1 bg-white border border-slate-100 rounded-2xl px-6 py-4 text-sm text-slate-500 font-medium outline-none"
                    />
                    <button
                      onClick={handleCopy}
                      className="px-8 py-4 bg-brand-purple text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:shadow-lg transition-all"
                    >
                      {copied ? <Check size={20} /> : <Clipboard size={20} />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlassCard>
    </div>
  );
};

const ClientForm = () => {
  const [searchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [driveLink, setDriveLink] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<any>({
    "الاسم": "",
    "هل تمتلك صفحة للمؤسسة وحساب انستجرام قائم بالفعل؟": "لا",
    "تعريف عن المؤسسة (بالتفصيل)؟": "",
    "ماهو تاريخ تأسيس المؤسسة؟": "",
    "ما هو رقم التسجيل الضريبي للمؤسسة؟": "",
    "هل تمتلك تعاقدات مع شركات اخري؟": "لا",
    "المنافسين": "",
    "دعاية المنافسين": "",
    "المنتجات والخدمات": "",
    "نقاط القوة": "",
    "نقاط الضعف": "",
    "العروض المتاحة": "",
    "هل تمتلك فوتوسيشن أو فيديو سيشن سابق للمؤسسة؟": "لا",
    "الاستهداف": "",
    "مبلغ التمويل": "",
    "المنصات": [],
    "مواعيد العمل": "",
    "بيان الأسعار": "لا",
    "أرقام وعناوين المؤسسة": "",
    "Creative ideas": "",
    "formal style": "",
    "Info posts": "",
    "Funny ideas": "",
    "Direct message": "",
    "Indirect message": "",
    "ما هو حجم المحتوي الذي تفضله؟": "مختصر ومفيد",
    "هل تمتلك لوجو؟ هل تريد تجديده وعمل لوجو جديد؟ هل تمتلك سورس اللوجو القديم؟": "",
    "ماهي الالوان المحببة لك بحيث تكون ألوان ال Branding الرئيسية على الصفحة؟": ""
  });

  useEffect(() => {
    const d = searchParams.get('d');
    if (d) {
      try {
        setDriveLink(atob(d));
      } catch (e) {
        console.error("Invalid link");
      }
    }
  }, [searchParams]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (platform: string) => {
    setFormData((prev: any) => {
      const current = prev["المنصات"];
      if (current.includes(platform)) {
        return { ...prev, "المنصات": current.filter((p: string) => p !== platform) };
      } else {
        return { ...prev, "المنصات": [...current, platform] };
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const submissionData = new FormData();
    submissionData.append('formData', JSON.stringify(formData));
    submissionData.append('driveLink', driveLink);
    selectedFiles.forEach(file => {
      submissionData.append('files', file);
    });

    try {
      const response = await fetch('/api/submit-brief', {
        method: 'POST',
        body: submissionData
      });

      if (response.ok) {
        setIsSubmitted(true);
        setShowModal(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert("Server returned error. Please check your Gmail App Password setup.");
      }
    } catch (error) {
      console.error(error);
      alert("Error submitting form. Ensure the server is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative py-16 px-6 sm:px-10 overflow-x-hidden">
      <AnimatedBackground />
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Cinematic Header */}
        <div className="text-center mb-24 relative">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="p-8 rounded-[3rem] bg-white shadow-2xl shadow-brand-purple/5 border border-slate-50 inline-block mb-10 relative z-10"
          >
            <img src={LOGO_URL} alt="Logo" className="w-28 h-28 lg:w-36 lg:h-36 mx-auto object-contain" />
          </motion.div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-purple/5 blur-[100px] rounded-full -z-0" />
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-5xl lg:text-7xl font-black text-slate-800 tracking-tighter mb-6 uppercase"
          >
            TRANSITION <span className="text-brand-purple">Brief Form</span>
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 font-bold text-xl max-w-2xl mx-auto leading-relaxed tracking-tight"
          >
            Transforming your brand through data-driven creativity. Let's start the journey.
          </motion.p>
        </div>

        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.form
              key="form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleSubmit}
              className="space-y-12"
            >
              {/* General Info */}
              <GlassCard>
                <SectionTitle icon={Info} title="General info" />
                <InputField
                  label="الاسم*"
                  name="الاسم"
                  value={formData["الاسم"]}
                  onChange={handleChange}
                  required
                  placeholder="الاسم..."
                />
              </GlassCard>

              {/* Marketing Brief */}
              <GlassCard>
                <SectionTitle icon={Target} title="Marketing Breif" />
                <div className="space-y-10">
                  <RadioGroup
                    label="هل تمتلك صفحة للمؤسسة وحساب انستجرام قائم بالفعل؟ (فى حالة نعم برجاء رفع حسابات الشركة أدمن واخذ يوزنيم وباسورد حساب الانستجرام؟)"
                    name="هل تمتلك صفحة للمؤسسة وحساب انستجرام قائم بالفعل؟"
                    value={formData["هل تمتلك صفحة للمؤسسة وحساب انستجرام قائم بالفعل؟"]}
                    onChange={handleChange}
                    options={[{ label: "نعم", value: "نعم" }, { label: "لا", value: "لا" }]}
                  />
                  <TextAreaField
                    label="تعريف عن المؤسسة (بالتفصيل)؟"
                    name="تعريف عن المؤسسة (بالتفصيل)؟"
                    value={formData["تعريف عن المؤسسة (بالتفصيل)؟"]}
                    onChange={handleChange}
                    placeholder="وصف المؤسسة..."
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <InputField
                      label="ماهو تاريخ تأسيس المؤسسة؟"
                      name="ماهو تاريخ تأسيس المؤسسة؟"
                      value={formData["ماهو تاريخ تأسيس المؤسسة؟"]}
                      onChange={handleChange}
                      placeholder="تاريخ التأسيس..."
                    />
                    <InputField
                      label="ما هو رقم التسجيل الضريبي للمؤسسة؟"
                      name="ما هو رقم التسجيل الضريبي للمؤسسة؟"
                      value={formData["ما هو رقم التسجيل الضريبي للمؤسسة؟"]}
                      onChange={handleChange}
                      placeholder="الرقم الضريبي..."
                    />
                  </div>
                  <RadioGroup
                    label="هل تمتلك تعاقدات مع شركات اخري؟"
                    name="هل تمتلك تعاقدات مع شركات اخري؟"
                    value={formData["هل تمتلك تعاقدات مع شركات اخري؟"]}
                    onChange={handleChange}
                    options={[{ label: "نعم", value: "نعم" }, { label: "لا", value: "لا" }]}
                  />
                  <TextAreaField
                    label="من هم المنافسين لك في المنطقة المحيطة أو المحافظة (أسماء) أو لينكات لديهم سوشيال ميديا؟"
                    name="المنافسين"
                    value={formData["المنافسين"]}
                    onChange={handleChange}
                    placeholder="المنافسين..."
                  />
                  <TextAreaField
                    label="أكتر 3 منافسين معجب بالدعايا الخاصة بهم (أسماء) أو لينكات مع ذكر سبب الأعجاب؟"
                    name="دعاية المنافسين"
                    value={formData["دعاية المنافسين"]}
                    onChange={handleChange}
                    placeholder="3_منافسين"
                  />
                  <TextAreaField
                    label="ماهى المنتجات أو الخدمات التي تقدمها المؤسسة (بالتفصيل) مع ذكر ميزة أو العرض المتاح كل منتج (بالتفصيل)؟"
                    name="المنتجات والخدمات"
                    value={formData["المنتجات والخدمات"]}
                    onChange={handleChange}
                    placeholder="خدمات..."
                  />
                  <TextAreaField
                    label="ما هي نقاط القوة التي يجب التركيز عليها والتي تميز المؤسسة او الخدمة عن غيرها من المنافسين (بالتفصيل)؟"
                    name="نقاط القوة"
                    value={formData["نقاط القوة"]}
                    onChange={handleChange}
                    placeholder="نقاط القوة..."
                  />
                  <TextAreaField
                    label="نقاط الضعف لدي المؤسسة وتريد حلها؟"
                    name="نقاط الضعف"
                    value={formData["نقاط الضعف"]}
                    onChange={handleChange}
                    placeholder="نقاط الضعف..."
                  />
                  <TextAreaField
                    label="ماهي العروض المتاحة المطلوب الأعلان عنها خلال الشهر الحالي؟"
                    name="العروض المتاحة"
                    value={formData["العروض المتاحة"]}
                    onChange={handleChange}
                    placeholder="عروض..."
                  />
                  <RadioGroup
                    label="هل تمتلك فوتوسيشن أو فيديو سيشن سابق للمؤسسة؟ (إذا كانت الإجابة بنعم برجاء إرفاق هذه الملفات)"
                    name="هل تمتلك فوتوسيشن أو فيديو سيشن سابق للمؤسسة؟"
                    value={formData["هل تمتلك فوتوسيشن أو فيديو سيشن سابق للمؤسسة؟"]}
                    onChange={handleChange}
                    options={[{ label: "نعم", value: "نعم" }, { label: "لا", value: "لا" }]}
                  />
                </div>
              </GlassCard>

              {/* Media Buyer Brief */}
              <GlassCard>
                <SectionTitle icon={Zap} title="Media buyer Brief" />
                <div className="space-y-10">
                  <TextAreaField
                    label="ما هو استهداف المؤسسة من حيث ( المكان - الفئة المستهدفة - السن - الجنس - ال class )"
                    name="الاستهداف"
                    value={formData["الاستهداف"]}
                    onChange={handleChange}
                    placeholder="الاستهداف..."
                  />
                  <InputField
                    label="ما هو مبلغ التمويل؟"
                    name="مبلغ التمويل"
                    value={formData["مبلغ التمويل"]}
                    onChange={handleChange}
                    placeholder="مبلغ التمويل..."
                  />
                  <CheckboxGroup
                    label="ما هي المنصات المراد تركيز التمويل عليها؟"
                    options={[
                      { label: "Facebook", value: "facebook" },
                      { label: "Instagram", value: "instagram" },
                      { label: "TikTok", value: "tiktok" },
                      { label: "Snapchat", value: "snapchat" }
                    ]}
                    selectedValues={formData["المنصات"]}
                    onChange={handleCheckboxChange}
                  />
                </div>
              </GlassCard>

              {/* Moderation Brief */}
              <GlassCard>
                <SectionTitle icon={MessageSquare} title="Moderation Brief" />
                <div className="space-y-10">
                  <TextAreaField
                    label="ماهي مواعيد العمل الرسمية وما هي الاجازات؟"
                    name="مواعيد العمل"
                    value={formData["مواعيد العمل"]}
                    onChange={handleChange}
                    placeholder="مواعيد..."
                  />
                  <RadioGroup
                    label="هل تمتلك بيان أسعار خاص للخدمات بالمؤسسة ؟ (إذا كانت الإجابة بنعم برجاء إرفاقه بهذا الملف)"
                    name="بيان الأسعار"
                    value={formData["بيان الأسعار"]}
                    onChange={handleChange}
                    options={[{ label: "نعم", value: "نعم" }, { label: "لا", value: "لا" }]}
                  />
                  <TextAreaField
                    label="ما هي أرقام وعناوين المؤسسة؟"
                    name="أرقام وعناوين المؤسسة"
                    value={formData["أرقام وعناوين المؤسسة"]}
                    onChange={handleChange}
                    placeholder="عنوان المؤسسة..."
                  />
                </div>
              </GlassCard>

              {/* Creative Brief */}
              <GlassCard>
                <SectionTitle icon={Palette} title="Creative Breif" />
                <div className="space-y-12">
                  <div className="text-right" dir="rtl">
                    <label className="block text-xl font-bold text-slate-800 mb-8 tracking-tight">ما هو شكل المحتوي الذي تفضله على منصات السوشيال ميديا؟ (الاجابة نسبة مئوية %)</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[
                        { label: "Creative ideas", name: "Creative ideas" },
                        { label: "formal style", name: "formal style" },
                        { label: "Info posts", name: "Info posts" },
                        { label: "Funny ideas", name: "Funny ideas" },
                        { label: "Direct message", name: "Direct message" },
                        { label: "Indirect message", name: "Indirect message" },
                      ].map(item => (
                        <div key={item.name} className="bg-white/60 p-6 rounded-[2rem] border border-slate-100 group hover:shadow-xl transition-all">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 block group-hover:text-brand-purple">{item.label}</span>
                          <div className="relative">
                            <input
                              type="text"
                              name={item.name}
                              value={formData[item.name]}
                              onChange={handleChange}
                              className="w-full bg-white/40 border border-slate-100 rounded-2xl px-6 py-4 text-brand-purple font-black text-2xl text-center focus:border-brand-purple/30 outline-none shadow-sm"
                              placeholder="ex: 10%"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-200 font-black text-lg">%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <RadioGroup
                    label="ما هو حجم المحتوي الذي تفضله؟"
                    name="ما هو حجم المحتوي الذي تفضله؟"
                    value={formData["ما هو حجم المحتوي الذي تفضله؟"]}
                    onChange={handleChange}
                    options={[
                      { label: "مختصر ومفيد", value: "مختصر ومفيد" },
                      { label: "طويل وفيه قيمة ويسمح بالنقاش", value: "طويل وفيه قيمة ويسمح بالنقاش" }
                    ]}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <TextAreaField
                      label="هل تمتلك لوجو؟ هل تريد تجديده وعمل لوجو جديد؟ هل تمتلك سورس اللوجو القديم؟"
                      name="هل تمتلك لوجو؟ هل تريد تجديده وعمل لوجو جديد؟ هل تمتلك سورس اللوجو القديم؟"
                      value={formData["هل تمتلك لوجو؟ هل تريد تجديده وعمل لوجو جديد؟ هل تمتلك سورس اللوجو القديم؟"]}
                      onChange={handleChange}
                      placeholder="تفاصيل اللوجو..."
                    />
                    <TextAreaField
                      label="ماهي الالوان المحببة لك بحيث تكون ألوان ال Branding الرئيسية على الصفحة؟"
                      name="ماهي الالوان المحببة لك بحيث تكون ألوان ال Branding الرئيسية على الصفحة؟"
                      value={formData["ماهي الالوان المحببة لك بحيث تكون ألوان ال Branding الرئيسية على الصفحة؟"]}
                      onChange={handleChange}
                      placeholder="الالوان..."
                    />
                  </div>
                </div>
              </GlassCard>

              {/* Immersive Uplodaer */}
              <motion.div
                whileHover={{ scale: 1.005 }}
                className="p-1 rounded-[2.8rem] bg-gradient-to-br from-brand-purple/10 via-white to-brand-orange/10 shadow-2xl shadow-brand-purple/5"
              >
                <div className="bg-white/60 backdrop-blur-3xl p-10 lg:p-20 rounded-[2.7rem] text-center relative overflow-hidden group" dir="rtl">
                  <div className="relative z-10">
                    <div className="w-24 h-24 bg-brand-purple text-white rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-xl shadow-brand-purple/20">
                      <Plus size={48} strokeWidth={3} />
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-black text-slate-800 mb-6 tracking-tight">أو قم بالرفع المباشر هنا</h2>
                    <p className="text-slate-500 text-xl font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
                      سيتم إرفاق هذه الملفات مع طلبك لضمان دقة التنفيذ الإبداعي.
                    </p>

                    <div className="flex flex-col items-center gap-8">
                      <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-4 px-12 py-6 bg-slate-900 text-white rounded-[2rem] hover:scale-105 active:scale-95 transition-all font-black text-xl shadow-2xl relative group/btn"
                      >
                        <Upload size={28} strokeWidth={3} />
                        <span>Upload Files</span>
                      </button>

                      <p className="text-slate-400 font-bold text-sm">أو يمكنك استخدام رابط جوجل درايف المرفق بالأسفل</p>

                      <AnimatePresence>
                        {selectedFiles.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-2xl bg-white/80 border border-slate-100 rounded-[2rem] p-8 shadow-xl text-right"
                          >
                            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                              <span className="text-slate-400 font-black text-sm uppercase tracking-widest">Selected Files ({selectedFiles.length})</span>
                              <button type="button" onClick={() => setSelectedFiles([])} className="text-brand-purple font-black text-sm hover:underline">Clear List</button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                              {selectedFiles.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-white/40 rounded-2xl border border-white hover:border-brand-purple/20 transition-all">
                                  <div className="flex items-center gap-3 overflow-hidden">
                                    <FileText size={20} className="text-slate-300 shrink-0" />
                                    <span className="text-sm text-slate-700 truncate font-black">{file.name}</span>
                                  </div>
                                  <button type="button" onClick={() => removeFile(idx)} className="p-2 hover:bg-brand-purple/10 text-slate-300 hover:text-brand-purple rounded-xl transition-all"><Trash2 size={18} /></button>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>

              <footer className="py-20 flex flex-col items-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full max-w-2xl py-8 bg-gradient-to-r from-brand-purple via-brand-orange to-brand-purple bg-[length:200%_auto] animate-gradient-x text-white font-black text-3xl rounded-[2.5rem] shadow-2xl shadow-brand-purple/30 disabled:opacity-30 transition-all relative group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <span className="relative z-10">{isSubmitting ? "جاري الإرسال..." : "إرسال البيانات"}</span>
                </button>
              </footer>
            </motion.form>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-24"
            >
              <GlassCard className="max-w-2xl mx-auto text-center border-emerald-100 bg-emerald-50/10">
                <div className="w-28 h-28 bg-emerald-50 text-emerald-500 rounded-[2.2rem] flex items-center justify-center mx-auto mb-10 shadow-xl shadow-emerald-500/10">
                  <Check size={56} strokeWidth={4} />
                </div>
                <h2 className="text-5xl font-black text-slate-800 mb-8 tracking-tight">Submission Completed</h2>
                <p className="text-slate-500 text-2xl font-medium mb-12 leading-relaxed" dir="rtl">
                  لقد تم استلام بياناتك بنجاح. فريق
                  <span className="text-brand-purple font-black mx-2">Transition Agency</span>
                  سيبدأ العمل على مشروعك فوراً.
                </p>
                <div className="p-8 rounded-[2rem] bg-white border border-slate-100/50 shadow-sm inline-block">
                  <p className="text-slate-400 font-bold mb-4 uppercase text-xs tracking-[0.2em]">Safety Note:</p>
                  <p className="text-slate-600 font-black">Your data has been secured and sent via official channels.</p>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="text-center pb-24 relative">
          <div className="w-20 h-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent mx-auto mb-10" />
          <p className="text-slate-400 font-black text-xs uppercase tracking-[0.8em]">© 2026 TRANSITION ADVERTISING AGENCY</p>
        </footer>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-500/10"
        >
          <Check size={40} strokeWidth={4} />
        </motion.div>
        <h2 className="text-3xl font-black text-slate-800 mb-6 tracking-tight">تم الإرسال بنجاح!</h2>
        <p className="text-slate-500 text-lg font-medium mb-10 leading-relaxed" dir="rtl">
          تم استقبال ردك بنجاح، فريق
          <span className="text-brand-purple font-black mx-1">Transition Agency</span>
          سيقوم بمراجعة بياناتك والتواصل معك قريباً.
        </p>
        {driveLink && (
          <a
            href={driveLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full py-5 mb-4 bg-brand-purple/5 border border-brand-purple/20 text-brand-purple rounded-2xl font-black hover:bg-brand-purple/10 transition-all"
          >
            <ExternalLink size={20} />
            <span>Open Your Drive Folder</span>
          </a>
        )}
        <button
          onClick={() => setShowModal(false)}
          className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:scale-105 transition-all text-sm uppercase tracking-widest shadow-xl"
        >
          Got it
        </button>
      </Modal>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminPage />} />
        <Route path="/form" element={<ClientForm />} />
      </Routes>
    </BrowserRouter>
  );
}
