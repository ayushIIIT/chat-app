const AuthImagePattern = ({ title, subtitle }) => {
  return (
      <div className="hidden lg:flex items-center justify-center bg-base-200 p-12 relative overflow-hidden">
      <div className="max-w-md text-center z-10 relative">
        {/* Dynamic, staggered floating shapes */}
        <div className="flex justify-center items-center gap-6 mb-12">
          
          {/* Left Column */}
          <div className="flex flex-col gap-6 mt-12">
            <div 
              className="w-16 h-24 rounded-full bg-primary/10 animate-pulse" 
              style={{ animationDelay: "0ms" }} 
            />
            <div 
              className="w-16 h-16 rounded-2xl bg-primary/20 animate-pulse" 
              style={{ animationDelay: "200ms" }} 
            />
          </div>

          {/* Center Column */}
          <div className="flex flex-col gap-6">
            <div 
              className="w-20 h-20 rounded-3xl bg-primary/20 animate-pulse" 
              style={{ animationDelay: "150ms" }}   
            />
            {/* Center Focal Point */}
            <div className="w-20 h-32 rounded-full bg-primary/30 flex items-center justify-center shadow-2xl shadow-primary/20">
              <div className="w-10 h-10 rounded-full bg-primary/80 animate-ping opacity-75" />
              <div className="w-10 h-10 rounded-full bg-primary absolute" />
            </div>
            <div 
              className="w-20 h-20 rounded-3xl bg-primary/20 animate-pulse" 
              style={{ animationDelay: "400ms" }} 
            />
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-6 mt-12">
            <div 
              className="w-16 h-16 rounded-2xl bg-primary/20 animate-pulse" 
              style={{ animationDelay: "300ms" }} 
            />
            <div 
              className="w-16 h-24 rounded-full bg-primary/10 animate-pulse" 
              style={{ animationDelay: "500ms" }} 
            />
          </div>
          
        </div>

        {/* Text Content */}
        <h2 className="text-3xl font-bold mb-4 tracking-tight">{title}</h2>
        <p className="text-base-content/70 leading-relaxed text-lg">{subtitle}</p>
      </div>
    </div>
  );
};

export default AuthImagePattern;