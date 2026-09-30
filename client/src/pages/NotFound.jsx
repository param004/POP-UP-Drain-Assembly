import { Link } from "react-router-dom";
import Button from "../components/ui/Button.jsx";
import { SHOP_PATH } from "../data/paths.js";

export default function NotFound() {
  return (
    <div className="grid min-h-[80svh] place-items-center px-5 pt-16 sm:pt-[4.5rem]">
      <div className="text-center">
        <p className="eyebrow">error 404</p>
        <h1 className="display mt-4 text-[clamp(3rem,12vw,7rem)]">Nothing here.</h1>
        <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-ink-500">
          That page does not exist. It may have moved, or the link may be mistyped.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Button to="/" variant="solid" size="md">
            Back home
          </Button>
          <Button to={SHOP_PATH} variant="outline" size="md" withArrow>
            View the product
          </Button>
        </div>
        <p className="mt-10 text-xs text-ink-400">
          Looking for the 3D explorer?{" "}
          <Link to="/#explorer" className="underline underline-offset-4">
            Jump straight to it
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
