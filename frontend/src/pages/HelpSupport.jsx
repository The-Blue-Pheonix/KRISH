import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MessageCircle, BookOpen, HelpCircle, Phone, Mail, MapPin,
  ChevronDown, ChevronUp, ExternalLink, Search, Headphones, FileText, Sprout
} from 'lucide-react';

import faqsEn from '../data/faqs_en.json';
import faqsHi from '../data/faqs_hi.json';
import faqsBn from '../data/faqs_bn.json';
import faqsMr from '../data/faqs_mr.json';
import faqsTa from '../data/faqs_ta.json';

const faqLocales = {
  en: faqsEn,
  hi: faqsHi,
  bn: faqsBn,
  mr: faqsMr,
  ta: faqsTa
};

export default function HelpSupport() {
  const { t, i18n } = useTranslation();
  const [openFaq, setOpenFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const faqs = faqLocales[i18n.language?.split('-')[0]] || faqsEn;
  const filteredFaqs = faqs.filter(faq =>
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setContactForm({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-8">
      {/* Hero */}
      <div className="dashboard-card overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900"></div>
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1740&auto=format&fit=crop')] bg-cover bg-center"></div>
        <div className="relative z-10 p-8 md:p-12 text-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Headphones className="text-white" size={28} />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white mb-3">{t('help.title', 'How can we help you?')}</h1>
          <p className="text-emerald-100 text-sm md:text-base max-w-lg mx-auto font-medium">{t('help.subtitle', 'Find answers, guides, and contact our support team.')}</p>
          <div className="relative max-w-md mx-auto mt-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('help.search_placeholder', 'Search FAQs...')}
              className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-800 rounded-xl text-sm text-neutral-800 dark:text-neutral-200 font-medium focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: <BookOpen size={22} />, title: t('help.quick.guide', 'Farming Guide'), desc: t('help.quick.guide_desc', 'Soil, crops, pests & more'), link: '/dashboard/guide', color: 'emerald' },
          { icon: <Sprout size={22} />, title: t('help.quick.ai', 'Ask Krishi AI'), desc: t('help.quick.ai_desc', 'Get instant AI advice'), link: '/dashboard/ai', color: 'blue' },
          { icon: <FileText size={22} />, title: t('help.quick.docs', 'Documentation'), desc: t('help.quick.docs_desc', 'API & technical docs'), link: '#', color: 'purple' },
        ].map((item, i) => (
          <a
            key={i}
            href={item.link}
            className="dashboard-card p-5 flex items-start gap-4 hover:shadow-md transition-shadow group cursor-pointer"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              item.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
              item.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
              'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
            }`}>
              {item.icon}
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{item.title}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{item.desc}</p>
            </div>
          </a>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="dashboard-card p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <HelpCircle size={22} className="text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-lg font-black text-neutral-900 dark:text-white">{t('help.faq_title', 'Frequently Asked Questions')}</h2>
        </div>
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-8">{t('help.no_results', 'No matching questions found. Try a different search term.')}</p>
          ) : (
            filteredFaqs.map((faq, idx) => (
              <div key={idx} className="border border-neutral-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200 pr-4">{faq.q}</span>
                  {openFaq === idx ? <ChevronUp size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" /> : <ChevronDown size={18} className="text-neutral-400 shrink-0" />}
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 border-t border-neutral-100 dark:border-slate-700">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed pt-3">{faq.a}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Contact Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Contact Form */}
        <div className="lg:col-span-3 dashboard-card p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <MessageCircle size={22} className="text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-black text-neutral-900 dark:text-white">{t('help.contact_title', 'Contact Support')}</h2>
          </div>
          
          {submitted ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="text-emerald-600 dark:text-emerald-400" size={28} />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">{t('help.submitted_title', 'Message Sent!')}</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('help.submitted_desc', 'We\'ll get back to you within 24 hours.')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">{t('help.form.name', 'Your Name')}</label>
                  <input required type="text" value={contactForm.name} onChange={e => setContactForm(p => ({...p, name: e.target.value}))} className="w-full px-4 py-3 bg-neutral-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-xl text-sm text-neutral-800 dark:text-neutral-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">{t('help.form.email', 'Email')}</label>
                  <input required type="email" value={contactForm.email} onChange={e => setContactForm(p => ({...p, email: e.target.value}))} className="w-full px-4 py-3 bg-neutral-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-xl text-sm text-neutral-800 dark:text-neutral-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">{t('help.form.subject', 'Subject')}</label>
                <select required value={contactForm.subject} onChange={e => setContactForm(p => ({...p, subject: e.target.value}))} className="w-full px-4 py-3 bg-neutral-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-xl text-sm text-neutral-800 dark:text-neutral-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all">
                  <option value="">{t('help.form.select_topic', 'Select a topic...')}</option>
                  <option value="bug">{t('help.form.bug', 'Bug Report')}</option>
                  <option value="feature">{t('help.form.feature', 'Feature Request')}</option>
                  <option value="account">{t('help.form.account', 'Account Issue')}</option>
                  <option value="other">{t('help.form.other', 'Other')}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">{t('help.form.message', 'Message')}</label>
                <textarea required rows="4" value={contactForm.message} onChange={e => setContactForm(p => ({...p, message: e.target.value}))} className="w-full px-4 py-3 bg-neutral-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-xl text-sm text-neutral-800 dark:text-neutral-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none" />
              </div>
              <button type="submit" className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
                {t('help.form.send', 'Send Message')}
              </button>
            </form>
          )}
        </div>

        {/* Contact Info Card */}
        <div className="lg:col-span-2 space-y-4">
          <div className="dashboard-card p-6">
            <h3 className="text-sm font-black text-neutral-900 dark:text-white mb-4 uppercase tracking-wider">{t('help.info_title', 'Get in Touch')}</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center shrink-0">
                  <Mail size={18} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider">{t('help.info.email', 'Email')}</p>
                  <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">support@krishi.app</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
                  <Phone size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider">{t('help.info.phone', 'Phone')}</p>
                  <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">+91 98765 43210</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center shrink-0">
                  <MapPin size={18} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider">{t('help.info.address', 'Address')}</p>
                  <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">Kolkata, West Bengal, India</p>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-card p-6 bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/40">
            <h3 className="text-sm font-black text-emerald-800 dark:text-emerald-300 mb-2">{t('help.hours_title', 'Support Hours')}</h3>
            <div className="space-y-1.5 text-sm text-emerald-700 dark:text-emerald-400">
              <p className="font-medium">Mon - Fri: 9:00 AM - 6:00 PM IST</p>
              <p className="font-medium">Sat: 10:00 AM - 2:00 PM IST</p>
              <p className="text-emerald-600 dark:text-emerald-500 text-xs mt-2">{t('help.hours_note', 'AI assistant available 24/7')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
