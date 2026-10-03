import { Link } from 'react-router-dom';
import Avatar from '../common/Avatar';

const TherapistCard = ({ therapist, onBook }) => {
  const {
    _id,
    name,
    firstName,
    lastName,
    avatar,
    title = 'Clinical Psychologist',
    qualification = 'M.Phil Clinical Psychology',
    specializations = [],
    yearsExperience = 1,
    languages = ['English', 'Hindi'],
    bio = '',
    city = 'Online',
    sessionFee = 1200,
    modes = ['online'],
    rating = 5.0,
    reviewCount = 12,
    workingHours = [],
  } = therapist;

  const displayName = name || `Dr. ${firstName || ''} ${lastName || ''}`.trim();
  const availableDays = workingHours
    ?.filter((w) => w.enabled)
    ?.map((w) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][w.day]) || ['Mon - Fri'];

  const daysLabel = availableDays.length > 0 && availableDays.length < 7
    ? (availableDays.length > 3 ? `${availableDays[0]} - ${availableDays[availableDays.length - 1]}` : availableDays.join(', '))
    : 'Mon - Fri';

  return (
    <article className="group bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Header: Avatar, Name, Title, Badges */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative flex-shrink-0">
            <Avatar
              src={avatar}
              name={displayName}
              size="lg"
              className="w-14 h-14 rounded-2xl ring-2 ring-indigo-50 shadow-sm object-cover"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" title="Active" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                {displayName}
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                ✓ Verified
              </span>
            </div>
            <p className="text-xs font-medium text-slate-600 truncate mt-0.5">{title}</p>
            <p className="text-[11px] text-slate-400 truncate">{qualification}</p>
          </div>
        </div>

        {/* Rating, Experience & City */}
        <div className="flex items-center gap-3 text-xs text-slate-500 mb-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1 text-amber-500 font-semibold">
            <span>★</span>
            <span className="text-slate-800">{Number(rating).toFixed(1)}</span>
            <span className="text-slate-400 font-normal">({reviewCount})</span>
          </div>
          <span>•</span>
          <span>{yearsExperience}+ yrs exp</span>
          <span>•</span>
          <span className="truncate">{city}</span>
        </div>

        {/* Short Bio */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
          {bio || 'Experienced and empathetic professional offering personalized psychological therapy sessions.'}
        </p>

        {/* Specializations Badges */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {specializations.slice(0, 3).map((spec) => (
            <span
              key={spec}
              className="text-[11px] px-2.5 py-0.5 bg-slate-50 border border-slate-100 text-slate-600 rounded-lg font-medium"
            >
              {spec}
            </span>
          ))}
          {specializations.length > 3 && (
            <span className="text-[11px] px-2 py-0.5 bg-slate-50 text-slate-400 rounded-lg font-medium">
              +{specializations.length - 3} more
            </span>
          )}
        </div>

        {/* Languages & Modes */}
        <div className="space-y-1.5 text-xs text-slate-500 mb-4 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Languages:</span>
            <span className="font-medium text-slate-700">{languages.join(', ')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Days:</span>
            <span className="font-medium text-slate-700">{daysLabel}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Mode:</span>
            <span className="font-medium text-indigo-600">
              {modes.includes('online') && modes.includes('in_person')
                ? 'Online & In-person'
                : modes.includes('online')
                ? 'Online Video'
                : 'In-person'}
            </span>
          </div>
        </div>
      </div>

      {/* Pricing & Actions */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <span className="text-xs text-slate-400">Session Fee</span>
            <div className="text-lg font-extrabold text-slate-900">
              ₹{Number(sessionFee).toLocaleString('en-IN')}{' '}
              <span className="text-xs font-normal text-slate-400">/ 50 min</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link
            to={`/therapists/${_id}`}
            className="w-full text-center py-2.5 px-3 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            View Profile
          </Link>
          <button
            type="button"
            onClick={() => onBook?.(therapist)}
            className="w-full text-center py-2.5 px-3 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-100 hover:shadow-indigo-200 transition-all cursor-pointer"
          >
            Book Appointment
          </button>
        </div>
      </div>
    </article>
  );
};

export default TherapistCard;
