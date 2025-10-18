import { LibraryBig } from 'lucide-react'
import RegisterForm from '../components/forms/RegisterForm'
import { Link } from 'react-router-dom'
import { GoogleLoginButton } from '../components/forms/GoogleLoginButton'

export default function Register() {
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
            <span className="font-bold text-[40px] h-[49px]">Register</span>
          </div>
          <GoogleLoginButton />
          <div className="flex items-center gap-3 px-3 w-full">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="text-xs text-gray-500">or</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>
          <RegisterForm />
          <div className="flex justify-center gap-1 h-5 font-medium w-full">
            <span>Already have an account?</span>
            <Link to="/login" style={{ color: 'blue', textDecoration: 'underline' }}>
              Login
            </Link>
          </div>
        </div>
      </div>
      <div className="rounded-[20px] overflow-hidden w-full h-full">
        <img
          src="https://as1.ftcdn.net/v2/jpg/02/86/74/06/1000_F_286740601_d16NX2q8zoOfzkeN8pR8JBzbkDil2xjW.jpg"
          className="w-full h-full object-cover"
          alt="This is Placeholder image"
        />
      </div>
    </div>
  )
}
