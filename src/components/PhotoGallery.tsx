export const PhotoGallery = () => {
  const images = [
    {
      src: "/lovable-uploads/2f950cd7-4515-4f21-ab0c-9005a8bde6c2.png",
      alt: "Ice bath therapy session"
    },
    {
      src: "/lovable-uploads/029c3081-4504-4d35-b1af-8c8ec751d983.png", 
      alt: "Client enjoying ice bath"
    },
    {
      src: "/lovable-uploads/0c9e8b9e-c7cf-48f4-b85b-860370fe6702.png",
      alt: "Wellness experience"
    },
    {
      src: "/lovable-uploads/4b835fc2-686a-4098-bcd0-3b9519ea6cc0.png",
      alt: "Recovery session"
    },
    {
      src: "/lovable-uploads/103c68d2-52d4-4bb6-b77a-2938942d6c71.png",
      alt: "Founders team"
    }
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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