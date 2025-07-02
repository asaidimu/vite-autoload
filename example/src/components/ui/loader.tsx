export default function Loader(
  { className }: { className?: string } = { className: "" },
) {
  return (
    <div className={`${className} center`}>
      <div className="box-spinner">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );
}

export function LoadingView() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <Loader />
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="w-screen h-screen overflow-hidden">
    <LoadingView />
    </div>
  );
}
