import Link from "next/link";

import { ArrowLeftIcon } from "lucide-react";

export default function NotFound() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-6 py-12 transition-colors duration-300">
      <div className="relative">
        {/* Background pattern */}
        <div className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-40 dark:opacity-20">
          <div className="from-primary h-56 bg-linear-to-br to-purple-400 blur-[106px] dark:from-blue-700"></div>
          <div className="h-32 bg-linear-to-r from-cyan-400 to-sky-300 blur-[106px] dark:to-indigo-600"></div>
        </div>

        <div className="relative mx-auto max-w-xl text-center">
          <p className="text-primary dark:text-primary-foreground text-base font-semibold">
            404
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-gray-100">
            Page not found
          </h1>
          <p className="mt-4 text-base text-gray-500 dark:text-gray-400">
            Sorry, we couldn&apos;t find the page you&apos;re looking for.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="bg-primary hover:bg-primary/90 focus:ring-primary dark:bg-primary-foreground dark:text-primary dark:hover:bg-primary-foreground/90 dark:focus:ring-primary-foreground inline-flex items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white transition-all duration-300 ease-in-out focus:ring-2 focus:ring-offset-2 focus:outline-none"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to home
            </Link>
          </div>
        </div>

        {/* Animated 404 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <p className="animate-bounce text-9xl font-bold text-gray-900/20 dark:text-gray-100/20">
            404
          </p>
        </div>
      </div>
    </div>
  );
}
