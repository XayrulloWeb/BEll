import { useEffect, useState } from "react";
import useStore from "../store/useStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PlusCircle, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

// Компонент для вкладки "Управление Школами"
const SchoolsTab = () => {
    const { adminSchools, adminFetchSchools, adminAddSchool, adminDeleteSchool, isAdminLoading } = useStore();
    const [isAddSchoolOpen, setIsAddSchoolOpen] = useState(false);
    const [newSchoolName, setNewSchoolName] = useState("");

    useEffect(() => {
        adminFetchSchools();
    }, []);

    const handleAddSchool = () => {
        if (newSchoolName.trim()) {
            adminAddSchool(newSchoolName.trim());
            setNewSchoolName("");
            setIsAddSchoolOpen(false);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Школы</CardTitle>
                    <CardDescription>Создание и удаление учебных заведений</CardDescription>
                </div>
                <Button onClick={() => setIsAddSchoolOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Добавить школу</Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>ID Школы</TableHead><TableHead>Название</TableHead><TableHead className="text-right">Действия</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {isAdminLoading && <TableRow><TableCell colSpan={3} className="text-center">Загрузка...</TableCell></TableRow>}
                        {adminSchools.map(school => (
                            <TableRow key={school.id}>
                                <TableCell className="font-mono">{school.id}</TableCell>
                                <TableCell>{school.name}</TableCell>
                                <TableCell className="text-right">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>Вы уверены?</AlertDialogTitle><AlertDialogDescription>Это действие удалит школу и ВСЕ связанные с ней данные (расписания, пользователи). Отменить это будет невозможно.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => adminDeleteSchool(school.id)} className="bg-destructive hover:bg-destructive/90">Да, удалить</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>

            <Dialog open={isAddSchoolOpen} onOpenChange={setIsAddSchoolOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Создать новую школу</DialogTitle></DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label htmlFor="school-name">Название школы</Label>
                        <Input id="school-name" value={newSchoolName} onChange={e => setNewSchoolName(e.target.value)} />
                    </div>
                    <DialogFooter><Button onClick={handleAddSchool}>Создать</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

// Компонент для вкладки "Управление Пользователями"
const UsersTab = () => {
    const { adminSchools, adminUsers, adminFetchUsers, adminAddUser, adminDeleteUser, isAdminLoading } = useStore();
    const [selectedSchool, setSelectedSchool] = useState<string>("");
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [newUserData, setNewUserData] = useState({ username: "", password: "" });

    useEffect(() => {
        if (selectedSchool) {
            adminFetchUsers(selectedSchool);
        }
    }, [selectedSchool]);

    const handleAddUser = () => {
        if (newUserData.username.trim() && newUserData.password.trim() && selectedSchool) {
            adminAddUser({ ...newUserData, schoolId: selectedSchool });
            setNewUserData({ username: "", password: "" });
            setIsAddUserOpen(false);
        }
    };
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Пользователи</CardTitle>
                    <CardDescription>Управление администраторами школ</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                     <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                        <SelectTrigger className="w-[280px]"><SelectValue placeholder="Выберите школу..." /></SelectTrigger>
                        <SelectContent>{adminSchools.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button onClick={() => setIsAddUserOpen(true)} disabled={!selectedSchool}><PlusCircle className="mr-2 h-4 w-4" /> Добавить пользователя</Button>
                </div>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader><TableRow><TableHead>ID Пользователя</TableHead><TableHead>Имя</TableHead><TableHead>Роль</TableHead><TableHead className="text-right">Действия</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {!selectedSchool && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Пожалуйста, выберите школу</TableCell></TableRow>}
                        {isAdminLoading && selectedSchool && <TableRow><TableCell colSpan={4} className="text-center">Загрузка...</TableCell></TableRow>}
                        {adminUsers.map(user => (
                            <TableRow key={user.id}>
                                <TableCell className="font-mono">{user.id}</TableCell>
                                <TableCell>{user.username}</TableCell>
                                <TableCell><span className="font-semibold text-primary">{user.role}</span></TableCell>
                                <TableCell className="text-right">
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>Вы уверены?</AlertDialogTitle><AlertDialogDescription>Вы собираетесь удалить пользователя {user.username}.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => adminDeleteUser(user.id)} className="bg-destructive hover:bg-destructive/90">Да, удалить</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Новый пользователь</DialogTitle></DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2"><Label>Имя пользователя</Label><Input value={newUserData.username} onChange={e => setNewUserData(p => ({...p, username: e.target.value}))} /></div>
                        <div className="space-y-2"><Label>Пароль</Label><Input type="password" value={newUserData.password} onChange={e => setNewUserData(p => ({...p, password: e.target.value}))} /></div>
                    </div>
                    <DialogFooter><Button onClick={handleAddUser}>Создать</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};


// Главный компонент страницы
export function SuperAdminPage() {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="text-3xl font-bold tracking-tight mb-4">Панель Супер-администратора</h1>
            <Tabs defaultValue="schools">
                <TabsList>
                    <TabsTrigger value="schools">Управление Школами</TabsTrigger>
                    <TabsTrigger value="users">Управление Пользователями</TabsTrigger>
                </TabsList>
                <TabsContent value="schools" className="mt-4"><SchoolsTab /></TabsContent>
                <TabsContent value="users" className="mt-4"><UsersTab /></TabsContent>
            </Tabs>
        </motion.div>
    );
}