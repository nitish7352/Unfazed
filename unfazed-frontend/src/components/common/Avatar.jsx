import { useState } from 'react';
import { getAssetUrl } from '../../utils/assetUrl';

const Avatar = ({ src, name = '', size = 'md', className = '' }) => {
  const [failedSrc, setFailedSrc] = useState(null);
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base', xl: 'w-20 h-20 text-xl' };
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const imageUrl = getAssetUrl(src);

  return imageUrl && failedSrc !== imageUrl ? (
    <img
      src={imageUrl}
      alt={name || 'User avatar'}
      className={`${sizes[size]} rounded-full object-cover ring-2 ring-white ${className}`}
      onError={() => setFailedSrc(imageUrl)}
    />
  ) : (
    <div
      aria-label={name ? `${name} avatar` : 'Avatar'}
      className={`${sizes[size]} rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center ring-2 ring-white ${className}`}
    >
      {initials || '?'}
    </div>
  );
};

export default Avatar;
