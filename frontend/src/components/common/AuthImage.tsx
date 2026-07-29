'use client';

type AuthImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string;
};

/**
 * Same-origin image requests carry the HttpOnly BFF session cookie automatically.
 * Browser JavaScript never receives the bearer token.
 */
export function AuthImage({ src, alt = '', ...rest }: AuthImageProps) {
  return <img src={src} alt={alt} {...rest} />;
}
