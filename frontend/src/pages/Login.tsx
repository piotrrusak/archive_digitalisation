import { LibraryBig } from 'lucide-react'
import LoginForm from '../components/forms/LoginForm'
import { Link } from 'react-router-dom'
import { GoogleLoginButton } from '../components/forms/GoogleLoginButton'

export default function Login() {
  return (
    <div className="flex p-5 w-full h-full text-black-base">
      <div className="min-w-[600px] flex flex-col">
        <div className="w-full flex gap-3 p-3 items-center">
          <LibraryBig size={32} />
          <div className="text-3xl h-8 flex items-center leading-none">
            <span className="font-bold">Archive</span>
            <span>Digitalization</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-start justify-center px-20 gap-9">
          <div className="flex flex-col gap-2">
            <span className="font-bold text-[40px] h-[49px]">Welcome back</span>
            <span className="text-gray-text">Please enter your details</span>
          </div>
          <GoogleLoginButton />
          <div className="flex items-center gap-3 px-3 w-full">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="text-xs text-gray-500">or</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>
          <LoginForm />
          <div className="flex justify-center gap-1 h-5 font-medium w-full">
            <span>Don't have an account?</span>
            <Link to="/register" style={{ color: 'blue', textDecoration: 'underline' }}>
              Sign up
            </Link>
          </div>
        </div>
      </div>
      <div className="rounded-[20px] overflow-hidden w-full h-full">
        <img
          src="/kot.jpg"
          className="w-full h-full object-cover"
          alt="This is Placeholder image"
        />
      </div>
    </div>
  )
}
