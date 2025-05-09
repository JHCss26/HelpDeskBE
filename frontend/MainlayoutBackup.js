<div className="flex justify-between items-center w-full h-20 bg-white z-10 p-2.5 shadow-[2px_0_6px_0_hsla(0,0%,76.1%,0.5)] lg:hidden">
          <img src={Logo} alt="HelpDesk Logo" className="w-[250px]" />
          <div className="flex items-center space-x-4 w-auto">
            <NotificationBell />
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center justify-center w-15 h-15 rounded-full font-bold text-2x1 bg-gray-100 hover:bg-blue-300 hover:text-[#fff] focus:outline-none"
            >
              {initial}
            </button>
          </div>
          {open && (
            <div
              className="
                absolute 
                top-[12%] 
                right-0      
                transform -translate-y-1/2 
                w-40 
              bg-white border border-gray-200 rounded shadow-lg z-50
              transition-all duration-300 ease-in-out
              "
            >
              <button
                onClick={() => {
                  dispatch(logout());
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-[#373737] hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
        <header className="h-35 bg-white border-b border-b-[#d9d9d9] flex items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <img
              src={Logo}
              alt="HelpDesk Logo"
              className="hidden lg:flex h-[25%] w-[25%]"
            />
            <div className="block h-full">
              <div className="text-base md:text-lg lg:text-xl xl:text-2xl font-[700] mb-[14px] leading-[normal] block text-[#353D77]">
                Welcome to the Helers HelpDesk Support
              </div>
              <div className="text-[14px] font-[400] tracking-[0.16px] block text-[#353D77]">
                Please select an option below. If you need something else call
                +44 7442107141
              </div>
            </div>
          </div>
          {/* <div className=" justify-center items-center space-x-4 hidden lg:flex">
            <NotificationBell />
          </div> */}
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50">
          <Outlet />
        </main>