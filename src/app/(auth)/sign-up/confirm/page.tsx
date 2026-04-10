import Link from 'next/link';

export default function SignUpConfirmPage() {
  return (
    <div className='card w-full max-w-sm bg-base-200 shadow-xl'>
      <div className='card-body items-center text-center'>
        <h2 className='card-title'>Check Your Email</h2>
        <p className='py-2'>We sent you a confirmation link. Please check your email to verify your account.</p>
        <div className='card-actions'>
          <Link href='/' className='btn btn-primary'>
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
