import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function MinimalModal({ isOpen, onClose, item }) {
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen || !item) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4 sm:p-12 animate-in fade-in duration-300">

            <button
                onClick={onClose}
                className="absolute right-6 top-6 z-10 flex h-12 w-12 items-center justify-center text-foreground mix-blend-difference hover:text-primary transition-colors"
            >
                <X className="h-8 w-8" />
            </button>

            <div className="flex h-full w-full max-w-[1600px] flex-col md:flex-row items-center justify-center gap-12">
                <div className="w-full md:w-1/2 h-[50vh] md:h-[80vh]">
                    <img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-cover"
                    />
                </div>
                <div className="w-full md:w-1/2 flex flex-col justify-center max-w-xl">
                    <h2 className="font-editorial text-5xl md:text-7xl leading-none">{item.title}</h2>
                    <div className="mt-8 space-y-4 text-lg text-muted-foreground font-sans font-light">
                        <p>{item.description}</p>
                    </div>
                    {item.details && (
                        <div className="mt-8 border-t border-foreground pt-8">
                            <ul className="space-y-2 font-mono text-sm tracking-wide text-foreground uppercase">
                                {item.details.map((detail, idx) => (
                                    <li key={idx}>— {detail}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {item.price && (
                        <p className="mt-12 font-editorial text-4xl">{item.price}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
