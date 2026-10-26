import React, { useState } from 'react';
import { api } from '../services/api';
import { X, AlertCircle } from 'lucide-react';

interface CreateRFQModalProps {
  onClose: () => void;
  onCreated: (newRfqId?: string) => void;
  userRegion: string;
}

export const CreateRFQModal: React.FC<CreateRFQModalProps> = ({
  onClose,
  onCreated,
  userRegion,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Bearings & Transmission');
  const [quantity, setQuantity] = useState<number>(500);
  const [unit, setUnit] = useState('units');
  const [region, setRegion] = useState(userRegion || 'Chennai');
  const [deadline, setDeadline] = useState(() =>
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [description, setDescription] = useState('');
  const [publishImmediately, setPublishImmediately] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    'Bearings & Transmission',
    'Raw Materials & Metals',
    'Fasteners & Hardware',
    'Mechanical Components',
    'Electrical & Electronics',
    'Pumps & Fluid Systems',
    'Packaging Materials',
  ];

  const units = ['units', 'pcs', 'kg', 'tons', 'meters', 'sets', 'liters'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (quantity <= 0) {
      setError('Quantity must be a positive integer greater than zero.');
      return;
    }

    if (new Date(deadline) <= new Date()) {
      setError('Deadline must be a future date to allow regional suppliers time to quote.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.createRFQ({
        title,
        category,
        quantity: Number(quantity),
        unit,
        region,
        deadline: new Date(deadline).toISOString(),
        description,
      });

      const rfqId = res.data.rfq._id;

      if (publishImmediately) {
        await api.publishRFQ(rfqId);
      }

      onCreated(rfqId);
    } catch (err: any) {
      setError(err.message || 'Failed to create procurement RFQ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202522]/40 backdrop-blur-[2px]">
      <div className="w-full max-w-2xl rounded-[6px] bg-white border border-[#E5E7E4] shadow-md p-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E7E4]">
          <div>
            <h2 className="text-base font-semibold text-[#202522]">
              Create Procurement RFQ
            </h2>
            <p className="text-xs text-[#727873] mt-0.5">
              Specify requirement parameters for regional vendor bidding in {region}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[4px] text-[#727873] hover:text-[#202522] hover:bg-[#FAFAF9]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-[4px] bg-[#FDF3F3] border border-[#F1BABA] text-xs text-[#B84040] flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block font-medium text-[#202522] mb-1">
              Requirement Title <span className="text-[#B84040]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 500 Units Industrial Deep Groove Ball Bearings (6205-2RS)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-9 px-3 rounded-[4px] border border-[#E5E7E4] bg-white text-[#202522] placeholder:text-[#8E948F] focus:outline-hidden focus:border-[#245C46] focus:ring-1 focus:ring-[#245C46]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[#202522] mb-1">
                Category <span className="text-[#B84040]">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 px-3 rounded-[4px] border border-[#E5E7E4] bg-white text-[#202522] focus:outline-hidden focus:border-[#245C46] focus:ring-1 focus:ring-[#245C46]"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#202522] mb-1">
                Geographical Hub / Region <span className="text-[#B84040]">*</span>
              </label>
              <input
                type="text"
                required
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. Chennai"
                className="w-full h-9 px-3 rounded-[4px] border border-[#E5E7E4] bg-white text-[#202522] focus:outline-hidden focus:border-[#245C46] focus:ring-1 focus:ring-[#245C46]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-[#202522] mb-1">
                Quantity <span className="text-[#B84040]">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full h-9 px-3 rounded-[4px] border border-[#E5E7E4] bg-white text-[#202522] font-mono tabular-nums focus:outline-hidden focus:border-[#245C46] focus:ring-1 focus:ring-[#245C46]"
              />
            </div>

            <div>
              <label className="block font-medium text-[#202522] mb-1">
                Unit of Measure <span className="text-[#B84040]">*</span>
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-9 px-3 rounded-[4px] border border-[#E5E7E4] bg-white text-[#202522] focus:outline-hidden focus:border-[#245C46] focus:ring-1 focus:ring-[#245C46]"
              >
                {units.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block font-medium text-[#202522] mb-1">
                Quotation Deadline <span className="text-[#B84040]">*</span>
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full h-9 px-3 rounded-[4px] border border-[#E5E7E4] bg-white text-[#202522] focus:outline-hidden focus:border-[#245C46] focus:ring-1 focus:ring-[#245C46]"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#202522] mb-1">
              Technical Specifications & Material Requirements <span className="text-[#B84040]">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="Detail technical specifications, dimensional tolerances, grade (ISO, DIN, ASTM), testing certificates required, inspection requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-[4px] border border-[#E5E7E4] bg-white text-[#202522] placeholder:text-[#8E948F] leading-relaxed focus:outline-hidden focus:border-[#245C46] focus:ring-1 focus:ring-[#245C46]"
            />
          </div>

          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="publishToggle"
              checked={publishImmediately}
              onChange={(e) => setPublishImmediately(e.target.checked)}
              className="rounded-[3px] border-[#E5E7E4] text-[#245C46] focus:ring-[#245C46]"
            />
            <label htmlFor="publishToggle" className="text-[#202522] font-medium cursor-pointer">
              Publish immediately to regional vendors (<span className="text-[#245C46]">OPEN state</span>)
            </label>
          </div>

          <div className="pt-4 border-t border-[#E5E7E4] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-3 rounded-[4px] border border-[#E5E7E4] text-[#727873] hover:text-[#202522] hover:bg-[#FAFAF9] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-8 px-4 rounded-[4px] bg-[#245C46] hover:bg-[#1B4937] text-white font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : publishImmediately ? 'Create & Publish RFQ' : 'Save as Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
