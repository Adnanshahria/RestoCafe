import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMenuItems, useCategories, type DbMenuItem } from '@/hooks/useSupabaseData';
import { api } from '@/lib/api';

const MenuPage = () => {
  const { data: items, loading: itemsLoading, addItem, updateItem, deleteItem } = useMenuItems();
  const { data: cats, loading: catsLoading } = useCategories();
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState<DbMenuItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [form, setForm] = useState({ name: '', price: '', categoryId: '', description: '' });

  const filtered = items.filter(i => {
    const matchCat = activeCategory === 'all' || i.category_id === activeCategory;
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const openNew = () => {
    setEditItem(null);
    setSelectedFile(null);
    setForm({ name: '', price: '', categoryId: cats[0]?.id || '', description: '' });
    setIsDialogOpen(true);
  };

  const openEdit = (item: DbMenuItem) => {
    setEditItem(item);
    setSelectedFile(null);
    setForm({ name: item.name, price: item.price.toString(), categoryId: item.category_id || '', description: item.description || '' });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) return;
    
    let imageUrl = editItem?.image || null;

    if (selectedFile) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await api.post('/api/upload', formData);
        imageUrl = uploadRes.url;
      } catch (err) {
        console.error('Upload failed:', err);
      } finally {
        setIsUploading(false);
      }
    }

    if (editItem) {
      await updateItem(editItem.id, {
        name: form.name,
        price: parseFloat(form.price),
        category_id: form.categoryId || null,
        description: form.description || null,
        image: imageUrl,
      });
    } else {
      await addItem({
        name: form.name,
        price: parseFloat(form.price),
        category_id: form.categoryId || null,
        description: form.description || null,
        image: imageUrl,
        available: true,
      });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      await deleteItem(id);
    }
  };

  const toggleAvailability = async (item: DbMenuItem) => {
    await updateItem(item.id, { available: !item.available });
  };

  if (itemsLoading || catsLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

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
              <Card className={`border shadow-sm transition-all overflow-hidden ${!item.available ? 'opacity-50' : 'hover:shadow-md'}`}>
                <div className="aspect-video relative bg-muted flex items-center justify-center overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl text-muted-foreground/30">🍽️</span>
                  )}
                </div>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                      <span className="font-bold text-primary text-sm">${Number(item.price).toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{cats.find(c => c.id === item.category_id)?.name}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-7 flex-1 text-xs" onClick={() => toggleAvailability(item)}>
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

      {items.length === 0 && <p className="text-center text-muted-foreground py-10">No menu items yet. Add your first item!</p>}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Item' : 'New Menu Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Price ($)</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
              <div>
                <Label>Category</Label>
                <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{cats.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Item Image</Label>
              <div className="mt-1 flex items-center gap-4">
                {imageUrlPreview(editItem?.image, selectedFile) && (
                  <img src={imageUrlPreview(editItem?.image, selectedFile)!} className="h-16 w-16 rounded-md object-cover border" />
                )}
                <Input type="file" accept="image/*" onChange={e => setSelectedFile(e.target.files?.[0] || null)} className="text-sm h-9" />
              </div>
            </div>
            <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isUploading}>
              {isUploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</> : (editItem ? 'Save Changes' : 'Add Item')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function imageUrlPreview(existing: string | null | undefined, selected: File | null) {
  if (selected) return URL.createObjectURL(selected);
  return existing;
}

export default MenuPage;
