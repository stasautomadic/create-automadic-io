import React, { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('/api/login', { email, password });
      console.log(response)

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('company', response.data.company)
        localStorage.setItem('userId', response.data.id)
        localStorage.setItem('userName', response.data.userName)
        if(response.data.userAvatar) {
          localStorage.setItem('userImage', response.data.userAvatar)
        }
        router.push('/');
       } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
      <div className="w-full bg-white rounded-lg shadow border md:mt-0 sm:max-w-md xl:p-0 bg-white-800 border-white-700">
        <div className="flex items-center justify-center my-6 text-2xl font-semibold text-black">
          <img className="w-8 h-8 mr-2" src="/favicon.ico" alt="logo" />
          Automadic    
        </div>
        <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
          <h1 className="text-xl text-center font-bold leading-tight tracking-tight text-black md:text-2xl">
            Log In
          </h1>
          <form className="space-y-4 md:space-y-6" onSubmit={handleLogin}>
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
              Log in
            </button>
            {error && <p className='text-red-500 font-bold'>{error}</p>}
            <p className="text-sm font-light text-gray-500">
              Don’t have an account yet? 
              <Link href="/register">
                <span className="font-medium text-black hover:underline"> Sign up</span>
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
