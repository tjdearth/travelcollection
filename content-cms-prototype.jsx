import React, { useState } from 'react';
import { Search, Plus, Image, Video, FileText, MapPin, Building2, LayoutGrid, Upload, Edit3, Trash2, Eye, ChevronRight, Folder, Calendar, User, MoreHorizontal, Filter, Grid3X3, List, Play, X, Check, ArrowLeft, Link2, Layers } from 'lucide-react';

// Mock data
const mockDestinations = [
  { id: 1, name: 'Santorini, Greece', status: 'published', venues: 12, lastUpdated: '2 hours ago', thumbnail: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=200&h=150&fit=crop' },
  { id: 2, name: 'Kyoto, Japan', status: 'published', venues: 8, lastUpdated: '1 day ago', thumbnail: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=200&h=150&fit=crop' },
  { id: 3, name: 'Amalfi Coast, Italy', status: 'draft', venues: 15, lastUpdated: '3 days ago', thumbnail: 'https://images.unsplash.com/photo-1534113414509-0eec2bfb493f?w=200&h=150&fit=crop' },
  { id: 4, name: 'Bali, Indonesia', status: 'published', venues: 20, lastUpdated: '1 week ago', thumbnail: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=200&h=150&fit=crop' },
];

const mockVenues = [
  { id: 1, name: 'Canaves Oia Suites', destination: 'Santorini, Greece', type: 'Hotel', contentBlocks: 5, thumbnail: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=200&h=150&fit=crop' },
  { id: 2, name: 'Gion District', destination: 'Kyoto, Japan', type: 'Experience', contentBlocks: 3, thumbnail: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=200&h=150&fit=crop' },
  { id: 3, name: 'Le Sirenuse', destination: 'Amalfi Coast, Italy', type: 'Hotel', contentBlocks: 7, thumbnail: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=200&h=150&fit=crop' },
  { id: 4, name: 'Ubud Rice Terraces', destination: 'Bali, Indonesia', type: 'Activity', contentBlocks: 4, thumbnail: 'https://images.unsplash.com/photo-1531973576160-7125cd663d86?w=200&h=150&fit=crop' },
];

const mockMedia = [
  { id: 1, name: 'santorini-sunset.jpg', type: 'image', size: '2.4 MB', used: 3, url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=300&h=200&fit=crop' },
  { id: 2, name: 'kyoto-temple.jpg', type: 'image', size: '1.8 MB', used: 5, url: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=300&h=200&fit=crop' },
  { id: 3, name: 'welcome-video.mp4', type: 'video', size: '45.2 MB', used: 2, url: null },
  { id: 4, name: 'amalfi-coast.jpg', type: 'image', size: '3.1 MB', used: 7, url: 'https://images.unsplash.com/photo-1534113414509-0eec2bfb493f?w=300&h=200&fit=crop' },
  { id: 5, name: 'bali-temple.jpg', type: 'image', size: '2.7 MB', used: 4, url: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=300&h=200&fit=crop' },
  { id: 6, name: 'drone-footage.mp4', type: 'video', size: '128 MB', used: 1, url: null },
];

// Styled components using Tailwind classes
const StatusBadge = ({ status }) => {
  const styles = {
    published: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    draft: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    archived: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };
  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const NavItem = ({ icon: Icon, label, active, onClick, count }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group
      ${active 
        ? 'bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 text-white border border-violet-500/30' 
        : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
  >
    <Icon size={20} className={active ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300'} />
    <span className="flex-1 font-medium">{label}</span>
    {count !== undefined && (
      <span className={`text-xs px-2 py-0.5 rounded-full ${active ? 'bg-violet-500/30 text-violet-300' : 'bg-slate-700 text-slate-400'}`}>
        {count}
      </span>
    )}
  </button>
);

const ContentCard = ({ item, type, onEdit, onView }) => (
  <div className="group bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-700/50 hover:border-violet-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/10">
    <div className="relative aspect-video overflow-hidden">
      {item.thumbnail ? (
        <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
          <MapPin size={32} className="text-slate-600" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
        <button onClick={() => onView?.(item)} className="flex-1 bg-white/10 backdrop-blur-sm text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2">
          <Eye size={14} /> View
        </button>
        <button onClick={() => onEdit?.(item)} className="flex-1 bg-violet-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-violet-600 transition-colors flex items-center justify-center gap-2">
          <Edit3 size={14} /> Edit
        </button>
      </div>
    </div>
    <div className="p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-white text-lg leading-tight">{item.name}</h3>
        {item.status && <StatusBadge status={item.status} />}
      </div>
      <div className="flex items-center gap-4 text-sm text-slate-400">
        {type === 'destination' && (
          <>
            <span className="flex items-center gap-1.5"><Building2 size={14} />{item.venues} venues</span>
            <span className="flex items-center gap-1.5"><Calendar size={14} />{item.lastUpdated}</span>
          </>
        )}
        {type === 'venue' && (
          <>
            <span className="flex items-center gap-1.5"><MapPin size={14} />{item.destination}</span>
            <span className="flex items-center gap-1.5"><Layers size={14} />{item.contentBlocks} blocks</span>
          </>
        )}
      </div>
    </div>
  </div>
);

const MediaCard = ({ item, selected, onSelect }) => (
  <div 
    onClick={() => onSelect?.(item)}
    className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300
      ${selected ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-slate-900' : 'hover:ring-2 hover:ring-slate-600'}`}
  >
    <div className="aspect-square bg-slate-800">
      {item.type === 'image' && item.url ? (
        <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex flex-col items-center justify-center gap-2">
          {item.type === 'video' ? <Play size={32} className="text-slate-500" /> : <Image size={32} className="text-slate-500" />}
          <span className="text-xs text-slate-500 uppercase tracking-wider">{item.type}</span>
        </div>
      )}
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 p-3">
      <p className="text-sm font-medium text-white truncate">{item.name}</p>
      <p className="text-xs text-slate-400">{item.size} • Used {item.used}x</p>
    </div>
    {selected && (
      <div className="absolute top-3 right-3 w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center">
        <Check size={14} className="text-white" />
      </div>
    )}
  </div>
);

// Editor Panel Component
const EditorPanel = ({ item, type, onClose }) => (
  <div className="fixed inset-0 z-50 flex">
    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} />
    <div className="relative ml-auto w-full max-w-2xl bg-slate-900 border-l border-slate-700 shadow-2xl overflow-auto">
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="font-semibold text-white">Edit {type}</h2>
            <p className="text-sm text-slate-400">{item?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Discard
          </button>
          <button className="px-4 py-2 text-sm font-medium bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors">
            Save Changes
          </button>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Cover Image */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Cover Image</label>
          <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-800 border-2 border-dashed border-slate-600 hover:border-violet-500 transition-colors cursor-pointer group">
            {item?.thumbnail ? (
              <>
                <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white font-medium">Change Image</span>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                <Upload size={32} className="mb-2" />
                <span>Click to upload or drag and drop</span>
              </div>
            )}
          </div>
        </div>

        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
          <input 
            type="text" 
            defaultValue={item?.name}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
          <textarea 
            rows={4}
            placeholder="Enter a compelling description..."
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
          <div className="flex gap-2">
            {['draft', 'published', 'archived'].map((status) => (
              <button 
                key={status}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  item?.status === status 
                    ? 'bg-violet-500 text-white' 
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content Blocks Section */}
        <div className="pt-4 border-t border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Content Blocks</h3>
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 rounded-lg transition-colors">
              <Plus size={16} /> Add Block
            </button>
          </div>
          <div className="space-y-3">
            {['Hero Section', 'Overview', 'Photo Gallery', 'Getting There'].map((block, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400">
                  <LayoutGrid size={18} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">{block}</p>
                  <p className="text-sm text-slate-500">Text + Media block</p>
                </div>
                <button className="p-2 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                  <MoreHorizontal size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Linked Media */}
        <div className="pt-4 border-t border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Linked Media</h3>
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 rounded-lg transition-colors">
              <Link2 size={16} /> Link Media
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {mockMedia.slice(0, 4).map((media) => (
              <div key={media.id} className="relative aspect-square rounded-lg overflow-hidden bg-slate-800 group">
                {media.url ? (
                  <img src={media.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play size={20} className="text-slate-500" />
                  </div>
                )}
                <button className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={12} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Main App Component
export default function ContentCMS() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [editingType, setEditingType] = useState(null);

  const handleEdit = (item, type) => {
    setEditingItem(item);
    setEditingType(type);
  };

  const toggleMediaSelect = (item) => {
    setSelectedMedia(prev => 
      prev.find(m => m.id === item.id) 
        ? prev.filter(m => m.id !== item.id)
        : [...prev, item]
    );
  };

  const stats = [
    { label: 'Destinations', value: mockDestinations.length, icon: MapPin, color: 'from-violet-500 to-purple-600' },
    { label: 'Venues', value: mockVenues.length, icon: Building2, color: 'from-fuchsia-500 to-pink-600' },
    { label: 'Media Files', value: mockMedia.length, icon: Image, color: 'from-amber-500 to-orange-600' },
    { label: 'Content Blocks', value: 24, icon: LayoutGrid, color: 'from-emerald-500 to-teal-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900/50 border-r border-slate-800 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
            <Layers size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">ContentHub</h1>
            <p className="text-xs text-slate-500">Composition Engine</p>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          <NavItem icon={LayoutGrid} label="Dashboard" active={activeSection === 'dashboard'} onClick={() => setActiveSection('dashboard')} />
          <NavItem icon={MapPin} label="Destinations" active={activeSection === 'destinations'} onClick={() => setActiveSection('destinations')} count={mockDestinations.length} />
          <NavItem icon={Building2} label="Venues" active={activeSection === 'venues'} onClick={() => setActiveSection('venues')} count={mockVenues.length} />
          <NavItem icon={Image} label="Media Library" active={activeSection === 'media'} onClick={() => setActiveSection('media')} count={mockMedia.length} />
          <NavItem icon={FileText} label="Content Blocks" active={activeSection === 'blocks'} onClick={() => setActiveSection('blocks')} count={24} />
        </nav>

        <div className="pt-6 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center text-sm font-bold">
              JD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Jane Doe</p>
              <p className="text-xs text-slate-500 truncate">Product Team</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold capitalize">{activeSection === 'dashboard' ? 'Dashboard' : activeSection}</h2>
              <p className="text-slate-500 text-sm mt-0.5">Manage your travel content library</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-11 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
              </div>
              {activeSection !== 'dashboard' && (
                <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white text-sm font-medium rounded-xl hover:from-violet-600 hover:to-fuchsia-700 transition-all shadow-lg shadow-violet-500/25">
                  <Plus size={18} />
                  Add New
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Dashboard View */}
          {activeSection === 'dashboard' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                  <div key={i} className="relative overflow-hidden rounded-2xl bg-slate-800/30 border border-slate-700/50 p-6 group hover:border-slate-600 transition-colors">
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                      <stat.icon size={24} className="text-white" />
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                    <p className="text-slate-400 text-sm">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Recent Activity */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">Recent Destinations</h3>
                  <button onClick={() => setActiveSection('destinations')} className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1">
                    View all <ChevronRight size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-6">
                  {mockDestinations.map((dest) => (
                    <ContentCard key={dest.id} item={dest} type="destination" onEdit={(item) => handleEdit(item, 'Destination')} />
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 rounded-2xl border border-violet-500/30 p-8">
                  <h3 className="text-xl font-semibold mb-2">Generate Booklet</h3>
                  <p className="text-slate-400 mb-6">Create a new travel booklet from your content library using the Composition Engine.</p>
                  <button className="px-6 py-3 bg-white text-slate-900 font-medium rounded-xl hover:bg-slate-100 transition-colors">
                    Start Composing
                  </button>
                </div>
                <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-8">
                  <h3 className="text-xl font-semibold mb-2">Upload Media</h3>
                  <p className="text-slate-400 mb-6">Add new images and videos to your library.</p>
                  <button onClick={() => setActiveSection('media')} className="px-6 py-3 bg-slate-700 text-white font-medium rounded-xl hover:bg-slate-600 transition-colors">
                    Open Library
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Destinations View */}
          {activeSection === 'destinations' && (
            <div>
              <div className="flex items-center gap-4 mb-6">
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-colors">
                  <Filter size={16} /> Filter
                </button>
                <div className="flex bg-slate-800 rounded-lg p-1">
                  <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>
                    <Grid3X3 size={18} />
                  </button>
                  <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>
                    <List size={18} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-6">
                {mockDestinations.map((dest) => (
                  <ContentCard key={dest.id} item={dest} type="destination" onEdit={(item) => handleEdit(item, 'Destination')} />
                ))}
              </div>
            </div>
          )}

          {/* Venues View */}
          {activeSection === 'venues' && (
            <div>
              <div className="flex items-center gap-4 mb-6">
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-colors">
                  <Filter size={16} /> Filter
                </button>
                <select className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500">
                  <option>All Destinations</option>
                  {mockDestinations.map(d => <option key={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-4 gap-6">
                {mockVenues.map((venue) => (
                  <ContentCard key={venue.id} item={venue} type="venue" onEdit={(item) => handleEdit(item, 'Venue')} />
                ))}
              </div>
            </div>
          )}

          {/* Media Library View */}
          {activeSection === 'media' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex bg-slate-800 rounded-lg p-1">
                    <button className="px-4 py-2 rounded-md bg-slate-700 text-white text-sm font-medium">All</button>
                    <button className="px-4 py-2 rounded-md text-slate-400 hover:text-white text-sm font-medium transition-colors">Images</button>
                    <button className="px-4 py-2 rounded-md text-slate-400 hover:text-white text-sm font-medium transition-colors">Videos</button>
                  </div>
                </div>
                {selectedMedia.length > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-400">{selectedMedia.length} selected</span>
                    <button className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors flex items-center gap-2">
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                )}
              </div>
              
              {/* Upload Zone */}
              <div className="mb-8 p-8 border-2 border-dashed border-slate-700 rounded-2xl hover:border-violet-500 transition-colors cursor-pointer group">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-violet-500/20 transition-colors">
                    <Upload size={28} className="text-slate-500 group-hover:text-violet-400 transition-colors" />
                  </div>
                  <p className="text-lg font-medium text-white mb-1">Drop files here or click to upload</p>
                  <p className="text-sm text-slate-500">PNG, JPG, MP4 up to 500MB</p>
                </div>
              </div>

              <div className="grid grid-cols-6 gap-4">
                {mockMedia.map((media) => (
                  <MediaCard 
                    key={media.id} 
                    item={media} 
                    selected={selectedMedia.find(m => m.id === media.id)}
                    onSelect={toggleMediaSelect}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Content Blocks View */}
          {activeSection === 'blocks' && (
            <div>
              <div className="grid grid-cols-3 gap-6 mb-8">
                {['Text Block', 'Image Gallery', 'Video Hero'].map((blockType, i) => (
                  <button key={i} className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-2xl hover:border-violet-500/50 transition-all text-left group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center mb-4 group-hover:from-violet-500/30 group-hover:to-fuchsia-500/30 transition-colors">
                      <Plus size={24} className="text-violet-400" />
                    </div>
                    <p className="font-semibold text-white mb-1">Create {blockType}</p>
                    <p className="text-sm text-slate-500">Add a new reusable content block</p>
                  </button>
                ))}
              </div>

              <h3 className="text-lg font-semibold mb-4">Existing Blocks</h3>
              <div className="space-y-3">
                {['Welcome Introduction', 'Safety Guidelines', 'Local Customs', 'Packing List', 'Emergency Contacts'].map((block, i) => (
                  <div key={i} className="flex items-center gap-4 p-5 bg-slate-800/30 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors group">
                    <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center">
                      <FileText size={20} className="text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">{block}</p>
                      <p className="text-sm text-slate-500">Used in {Math.floor(Math.random() * 10) + 1} destinations</p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <Eye size={18} />
                      </button>
                      <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <Edit3 size={18} />
                      </button>
                      <button className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Editor Panel */}
      {editingItem && (
        <EditorPanel 
          item={editingItem} 
          type={editingType}
          onClose={() => { setEditingItem(null); setEditingType(null); }} 
        />
      )}
    </div>
  );
}
