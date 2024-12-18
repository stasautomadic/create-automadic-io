import React, { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('/api/register', { name, email, password });

      if (response.data.success) {
        router.push('/login');
      } else {
        setError('Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration failed');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
      <div className="w-full bg-white rounded-lg shadow border md:mt-0 sm:max-w-md xl:p-0 bg-white-800 border-white-700">
        <div className="flex items-center justify-center my-6 text-2xl font-semibold text-black">
          <img className="w-8 h-8 mr-2" src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/logo.svg" alt="logo" />
          Automadic    
        </div>
        <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
          <h1 className="text-xl text-center font-bold leading-tight tracking-tight text-black md:text-2xl">
            Sign Up
          </h1>
          <form className="space-y-4 md:space-y-6" onSubmit={handleRegister}>
            <div>
              <label htmlFor="name" className="block mb-2 text-sm font-medium text-black">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                name="name"
                id="name"
                className="bg-white border border-gray-300 text-black rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block mb-2 text-sm font-medium text-black">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                name="email"
                id="email"
                className="bg-white border border-gray-300 text-black rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                placeholder="name@company.com"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block mb-2 text-sm font-medium text-black">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                name="password"
                id="password"
                placeholder="••••••••"
                className="bg-white border border-gray-300 text-black rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full text-white bg-slate-900 hover:bg-slate-950 focus:ring-4 focus:outline-none focus:ring-slate-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
            >
              Sign Up
            </button>
            {error && <p className='text-red-500 font-bold'>{error}</p>}
            <p className="text-sm font-light text-gray-500">
              Already have an account? 
              <Link href="/login">
                <span className="font-medium text-black hover:underline"> Log in</span>
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
