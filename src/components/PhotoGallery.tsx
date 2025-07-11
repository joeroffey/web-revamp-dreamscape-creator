export const PhotoGallery = () => {
  const images = [
    {
      src: "/lovable-uploads/25076f47-c2aa-4331-9cda-ba7cb683f9d4.png",
      alt: "Facility exterior view"
    },
    {
      src: "/lovable-uploads/c84d053f-63ed-4962-84d3-cec99682fcab.png",
      alt: "Sauna interior"
    },
    {
      src: "/lovable-uploads/eba50e37-1df6-41e8-8a26-7c4a6591821b.png",
      alt: "Wellness facility"
    },
    {
      src: "/lovable-uploads/7213f936-2c10-4a80-a628-96054c5c6507.png",
      alt: "Additional facility view"
    }
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div 
              key={index}
              className="aspect-square overflow-hidden rounded-2xl group cursor-pointer"
            >
              <img 
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};