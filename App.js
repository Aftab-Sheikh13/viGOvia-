import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './App.css';

export default function App() {
  const [title, setTitle] = useState('Vigovia Sample Trip');
  const [totalDuration, setTotalDuration] = useState('3 Days');
  const [travellers, setTravellers] = useState(2);
  const [departure, setDeparture] = useState('');
  const [arrival, setArrival] = useState('');
  const [hotel, setHotel] = useState({ name: '', city: '', checkIn: '', checkOut: '', nights: 0 });
  const [payments, setPayments] = useState([{ amount: '', dueDate: '' }]);
  const [inclusions, setInclusions] = useState('');
  const [exclusions, setExclusions] = useState('');
  const [days, setDays] = useState([
    { dayTitle: 'Day 1 - Arrival', morning: '', afternoon: '', evening: '', transports: [{ type: 'Flight', details: '' }] },
  ]);

  const previewRef = useRef(null);

  // --- Day & Transport handlers ---
  const addDay = () =>
    setDays([...days, { dayTitle: `Day ${days.length + 1}`, morning: '', afternoon: '', evening: '', transports: [{ type: '', details: '' }] }]);
  const removeDay = (idx) => { if (days.length > 1) setDays(days.filter((_, i) => i !== idx)); };
  const updateDay = (idx, field, value) => { const copy = [...days]; copy[idx][field] = value; setDays(copy); };

  const addTransport = (dayIdx) => { const copy = [...days]; copy[dayIdx].transports.push({ type: '', details: '' }); setDays(copy); };
  const updateTransport = (dayIdx, tIdx, field, value) => { const copy = [...days]; copy[dayIdx].transports[tIdx][field] = value; setDays(copy); };
  const removeTransport = (dayIdx, tIdx) => { const copy = [...days]; if (copy[dayIdx].transports.length > 1) { copy[dayIdx].transports.splice(tIdx, 1); setDays(copy); } };

  // --- Payment handlers ---
  const addPayment = () => setPayments([...payments, { amount: '', dueDate: '' }]);
  const updatePayment = (idx, field, value) => { const copy = [...payments]; copy[idx][field] = value; setPayments(copy); };
  const removePayment = (idx) => { if (payments.length > 1) setPayments(payments.filter((_, i) => i !== idx)); };

  // --- PDF Generation ---
  const generatePdf = async () => {
    if (!previewRef.current) return;
    const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true, allowTaint: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pxToMm = (px) => px * 0.264583;
    const imgProps = { width: pxToMm(canvas.width), height: pxToMm(canvas.height) };
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    if (imgProps.height <= pageHeight) {
      const ratio = Math.min(pageWidth / imgProps.width, pageHeight / imgProps.height);
      pdf.addImage(imgData, 'PNG', (pageWidth - imgProps.width * ratio) / 2, 10, imgProps.width * ratio, imgProps.height * ratio);
      pdf.save(`${title.replace(/\s+/g, '_').toLowerCase() || 'itinerary'}.pdf`);
      return;
    }

    const pageCanvas = document.createElement('canvas');
    const pageCtx = pageCanvas.getContext('2d');
    const mmToPx = (mm) => mm / 0.264583;
    const pagePixelHeight = Math.floor(mmToPx(pageHeight - 20));
    pageCanvas.width = canvas.width;
    pageCanvas.height = pagePixelHeight;

    let remainingHeight = canvas.height;
    let position = 0;
    let pageNum = 0;

    while (remainingHeight > 0) {
      pageCtx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
      pageCtx.drawImage(canvas, 0, position, canvas.width, pagePixelHeight, 0, 0, canvas.width, pagePixelHeight);
      const pageData = pageCanvas.toDataURL('image/png');
      if (pageNum > 0) pdf.addPage();
      pdf.addImage(pageData, 'PNG', 0, 10, pageWidth, pxToMm(pageCanvas.height));
      remainingHeight -= pagePixelHeight;
      position += pagePixelHeight;
      pageNum++;
    }

    pdf.save(`${title.replace(/\s+/g, '_').toLowerCase() || 'itinerary'}.pdf`);
  };

  // --- Print / Save Ticket ---
  const printTicket = () => {
    if (!previewRef.current) return;
    const w = window.open('', '', 'width=800,height=600');
    w.document.write('<html><head><title>Itinerary</title>');
    w.document.write('<style>body{font-family:Inter,sans-serif;padding:20px;} .border{border:1px solid #e5e7eb;border-radius:6px;padding:10px;margin-bottom:12px;}</style>');
    w.document.write('</head><body>');
    w.document.write(previewRef.current.innerHTML);
    w.document.write('</body></html>');
    w.document.close();
    w.print();
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6 text-white">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Itinerary Builder — Vigovia Task</h1>
            <p className="text-sm text-gray-300 mt-1">
              Fill the form and click <span className="font-medium">Get Itinerary</span> to export PDF or print ticket.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={generatePdf}
              className="px-4 py-2 bg-blue-700 text-white rounded shadow hover:opacity-90"
            >
              Get Itinerary
            </button>
            <button
              onClick={printTicket}
              className="px-4 py-2 bg-green-700 text-white rounded shadow hover:opacity-90"
            >
              Save / Print Ticket
            </button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT FORM */}
          <section className="bg-gray-800 p-6 rounded-lg shadow-sm overflow-auto max-h-[80vh]">
            <h2 className="text-lg font-semibold mb-4 text-white">Tour Overview</h2>
            <div className="space-y-3">
              {/* Trip Info */}
              <div>
                <label className="block text-sm font-medium text-gray-200">Trip Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-1/2 border rounded px-3 py-2 text-black" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-200">Total Duration</label>
                  <input value={totalDuration} onChange={(e) => setTotalDuration(e.target.value)} className="mt-1 w-1/2 border rounded px-3 py-2 text-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200">Travellers</label>
                  <input type="number" value={travellers} min={1} onChange={(e) => setTravellers(Number(e.target.value))} className="mt-1 w-1/2 border rounded px-3 py-2 text-black" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-200">Departure</label>
                  <input value={departure} onChange={(e) => setDeparture(e.target.value)} className="mt-1 w-1/2 border rounded px-3 py-2 text-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200">Arrival</label>
                  <input value={arrival} onChange={(e) => setArrival(e.target.value)} className="mt-1 w-1/2 border rounded px-3 py-2 text-black" />
                </div>
              </div>

              {/* Hotel */}
              <h3 className="text-md font-semibold mt-4 text-white">Hotel Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input placeholder="Hotel Name" value={hotel.name} onChange={(e) => setHotel({ ...hotel, name: e.target.value })} className="mt-1 w-1/2 border rounded px-3 py-2 text-black" />
                <input placeholder="City" value={hotel.city} onChange={(e) => setHotel({ ...hotel, city: e.target.value })} className="mt-1 w-1/2 border rounded px-3 py-2 text-black" />
                <input type="date" placeholder="Check-in" value={hotel.checkIn} onChange={(e) => setHotel({ ...hotel, checkIn: e.target.value })} className="mt-1 w-1/2 border rounded px-3 py-2 text-black" />
                <input type="date" placeholder="Check-out" value={hotel.checkOut} onChange={(e) => setHotel({ ...hotel, checkOut: e.target.value })} className="mt-1 w-1/2 border rounded px-3 py-2 text-black" />
                <input type="number" placeholder="Nights" value={hotel.nights} onChange={(e) => setHotel({ ...hotel, nights: Number(e.target.value) })} className="mt-1 w-1/2 border rounded px-3 py-2 text-black" />
              </div>

              {/* Payments */}
              <h3 className="text-md font-semibold mt-4 text-white">Payment Plan</h3>
              <div className="space-y-2">
                {payments.map((p, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                    <input placeholder="Amount" value={p.amount} onChange={(e) => updatePayment(idx, 'amount', e.target.value)} className="col-span-1 w-full border rounded px-2 py-1 text-black" />
                    <input type="date" placeholder="Due Date" value={p.dueDate} onChange={(e) => updatePayment(idx, 'dueDate', e.target.value)} className="col-span-1 w-full border rounded px-2 py-1 text-black" />
                    <div className="col-span-1 flex gap-2 flex-wrap">
                      <button onClick={addPayment} className="px-2 py-1 bg-green-500 rounded text-xs text-white">+ Add</button>
                      <button onClick={() => removePayment(idx)} className="px-2 py-1 bg-red-500 rounded text-xs text-white">Remove</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Inclusions / Exclusions */}
              <h3 className="text-md font-semibold mt-4 text-white">Inclusions / Exclusions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <textarea placeholder="Inclusions" value={inclusions} onChange={(e) => setInclusions(e.target.value)} className="border rounded px-3 py-2 text-white" />
                <textarea placeholder="Exclusions" value={exclusions} onChange={(e) => setExclusions(e.target.value)} className="border rounded px-3 py-2 text-white" />
              </div>

              {/* Days */}
              <h3 className="text-md font-semibold mt-4 text-white">Days</h3>
              <div className="space-y-4">
                {days.map((d, idx) => (
                  <div key={idx} className="border rounded p-3 bg-gray-700">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <input value={d.dayTitle} onChange={(e) => updateDay(idx, 'dayTitle', e.target.value)} className="font-semibold text-sm border-b px-1 py-1 text-black" />
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => addTransport(idx)} className="text-xs px-2 py-1 bg-green-500 text-white rounded">+ Transport</button>
                        <button onClick={() => removeDay(idx)} className="text-xs px-2 py-1 bg-red-500 text-white rounded">Remove Day</button>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <textarea placeholder="Morning" value={d.morning} onChange={(e) => updateDay(idx, 'morning', e.target.value)} className="border rounded px-2 py-1 text-black" />
                      <textarea placeholder="Afternoon" value={d.afternoon} onChange={(e) => updateDay(idx, 'afternoon', e.target.value)} className="border rounded px-2 py-1 text-black" />
                      <textarea placeholder="Evening" value={d.evening} onChange={(e) => updateDay(idx, 'evening', e.target.value)} className="border rounded px-2 py-1 text-black" />
                    </div>

                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-white">Transports / Transfers</h4>
                      <div className="space-y-2 mt-2">
                        {d.transports.map((t, tidx) => (
                          <div key={tidx} className="grid grid-cols-12 gap-2 items-center">
                            <select value={t.type} onChange={(e) => updateTransport(idx, tidx, 'type', e.target.value)} className="col-span-3 border rounded px-2 py-1 text-black">
                              <option value="">Select</option>
                              <option>Flight</option>
                              <option>Train</option>
                              <option>Bus</option>
                              <option>Transfer</option>
                              <option>Other</option>
                            </select>
                            <input placeholder="Details" value={t.details} onChange={(e) => updateTransport(idx, tidx, 'details', e.target.value)} className="col-span-8 border rounded px-2 py-1 text-black" />
                            <button onClick={() => removeTransport(idx, tidx)} className="col-span-1 text-xs px-2 py-1 bg-red-500 text-white rounded">x</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={addDay} className="px-4 py-2 bg-gray-600 text-white rounded">+ Add Day</button>
              </div>
            </div>
          </section>

          {/* RIGHT PREVIEW */}
          
        </main>
      </div>
    </div>
  );
}
