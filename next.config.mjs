/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/aide.html", destination: "/aide", permanent: true },
      {
        source: "/confidentialite.html",
        destination: "/confidentialite",
        permanent: true,
      },
      { source: "/congo.html", destination: "/congo", permanent: true },
      { source: "/publicite.html", destination: "/publicite", permanent: true },
    ];
  },
};

export default nextConfig;
