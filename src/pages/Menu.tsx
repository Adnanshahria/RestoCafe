import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { categories as defaultCategories, menuItems as defaultMenuItems } from '@/data/mock-data';
import { MenuItem, Category } from '@/types';

const MenuPage = () => {
  const [items, setItems] = useState<MenuItem[]>(defaultMenuItems);
  const [cats] = useState<Category[]>(defaultCategories);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', categoryId: '', description: '' });

  const filtered = items.filter(i => {
    const matchCat = activeCategory === 'all' || i.categoryId === activeCategory;
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const openNew = () => {
    setEditItem(null);
    setForm({ name: '', price: '', categoryId: cats[0]?.id || '', description: '' });
    setIsDialogOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditItem(item);
    setForm({ name: item.name, price: item.price.toString(), categoryId: item.categoryId, description: item.description || '' });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.price) return;
    if (editItem) {
      setItems(prev => prev.map(i => i.id === editItem.id ? { ...i, name: form.name, price: parseFloat(form.price), categoryId: form.categoryId, description: form.description } : i));
    } else {
      const newItem: MenuItem = {
        id: `m-${Date.now()}`,
        name: form.name,
        price: parseFloat(form.price),
        categoryId: form.categoryId,
        description: form.description,
        available: true,
      };
      setItems(prev => [...prev, newItem]);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const toggleAvailability = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, available: !i.available } : i));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Menu</h1>
          <p className="text-muted-foreground text-sm mt-1">{items.length} items across {cats.length} categories</p>
        </div>
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add Item</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search menu..." className="pl-8 h-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          <Button variant={activeCategory === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setActiveCategory('all')}>All</Button>
          {cats.map(c => (
            <Button key={c.id} variant={activeCategory === c.id ? 'default' : 'outline'} size="sm" onClick={() => setActiveCategory(c.id)} className="whitespace-nowrap">{c.name}</Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        <AnimatePresence mode="popLayout">
          {filtered.map(item => (
            <motion.div key={item.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <Card className={`border shadow-sm transition-all ${!item.available ? 'opacity-50' : 'hover:shadow-md'}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="h-20 rounded-lg bg-muted flex items-center justify-center text-3xl">🍽️</div>
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">{item.name}</h3>
                      <span className="font-bold text-primary text-sm">${item.price.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{cats.find(c => c.id === item.categoryId)?.name}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-7 flex-1 text-xs" onClick={() => toggleAvailability(item.id)}>
                      {item.available ? 'Available' : 'Unavailable'}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}><Pencil className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Item' : 'New Menu Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Price ($)</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
            <div>
              <Label>Category</Label>
              <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{cats.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editItem ? 'Save' : 'Add Item'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MenuPage;
