import { Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../../assets/Gesta - Logo.svg';

export default function MinimalNavbar({ onMenuClick }) {
    return (
        <header className="fixed top-0 z-40 w-full mix-blend-difference text-white">
            <div className="mx-auto flex h-24 max-w-[1600px] items-center justify-between px-6 lg:px-12">
                <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-70">
                    <img src={logo} alt="Gesta Logo" className="h-8 md:h-12 w-auto invert" />
                </Link>
                <button
                    onClick={onMenuClick}
                    aria-label="Ouvrir le menu"
                    className="group flex cursor-pointer items-center space-x-3 transition-opacity hover:opacity-70"
                >
                    <span className="hidden font-mono text-sm tracking-widest uppercase md:block">
                        Menu
                    </span>
                    <Menu className="h-8 w-8 transition-transform group-hover:scale-110" />
                </button>
            </div>
        </header>
    );
}
