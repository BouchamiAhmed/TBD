const GradientText = ({ children, gradient = "from-cyan-400 via-blue-500 to-violet-600" }) => (
  <span className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent font-bold`}>
    {children}
  </span>
);

export default GradientText;