'use client';

export function BackgroundOrbs() {
  return (
    <>
      <div className="fixed inset-0 -z-20 bg-gradient-to-b from-primary-50 to-primary-100" />
      <div className="fixed -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-primary-300/20 to-primary-400/20 rounded-full blur-3xl animate-float -z-10" />
      <div className="fixed -bottom-20 -left-20 w-64 h-64 bg-gradient-to-tr from-primary-200/20 to-primary-300/20 rounded-full blur-3xl animate-float -z-10" style={{ animationDelay: '10s' }} />
    </>
  );
}