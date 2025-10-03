import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MessageService, Message, supabase, Ticket } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AdminChat = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedManager, setSelectedManager] = useState<string>('AliPay Service');
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('admin_dark_mode') === 'true';
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastMessageCountRef = useRef<number>(0);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
    audioRef.current.volume = 0.5;
  }, []);

  useEffect(() => {
    if (sessionId) {
      loadMessages();
      loadTicketManager();
      MessageService.markAsRead(sessionId, true);
      const interval = setInterval(() => {
        loadMessages();
        MessageService.markAsRead(sessionId, true);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [sessionId]);

  useEffect(() => {
    const userMessages = messages.filter(m => !m.is_admin);
    if (lastMessageCountRef.current > 0 && userMessages.length > lastMessageCountRef.current) {
      audioRef.current?.play().catch(e => console.log('Audio play failed:', e));
    }
    lastMessageCountRef.current = userMessages.length;
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    if (!sessionId) return;
    try {
      const data = await MessageService.getMessages(sessionId);
      setMessages(data);
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    }
  };

  const loadTicketManager = async () => {
    if (!sessionId) return;
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('manager')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && data.manager) {
        setSelectedManager(data.manager);
      }
    } catch (error) {
      console.error('Ошибка загрузки менеджера:', error);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Файл слишком большой. Максимум 5 МБ');
        return;
      }
      setSelectedImage(file);
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('PDF слишком большой. Максимум 10 МБ');
        return;
      }
      if (file.type !== 'application/pdf') {
        alert('Можно загружать только PDF файлы');
        return;
      }
      setSelectedFile(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (pdfInputRef.current) {
      pdfInputRef.current.value = '';
    }
  };

  const sendMessage = async () => {
    if (!sessionId) return;
    if (!inputMessage.trim() && !selectedImage && !selectedFile) return;

    setUploading(true);
    try {
      let fileUrl: string | null = null;
      
      if (selectedImage) {
        fileUrl = await MessageService.uploadImage(selectedImage);
      } else if (selectedFile) {
        fileUrl = await MessageService.uploadFile(selectedFile);
      }

      await MessageService.sendMessage(
        sessionId, 
        inputMessage || (selectedFile ? `📄 ${selectedFile.name}` : ''), 
        true,
        null,
        fileUrl,
        selectedManager
      );

      setInputMessage('');
      clearImage();
      clearFile();
      loadMessages();
    } catch (error) {
      console.error('Ошибка отправки:', error);
      alert('Ошибка отправки сообщения');
    } finally {
      setUploading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <header className="border-b bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
              <Icon name="ArrowLeft" size={20} />
            </Button>
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Icon name="MessageCircle" size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Чат с клиентом</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Session: {sessionId?.substring(0, 20)}...</p>
            </div>
          </div>
          <Select 
            value={selectedManager} 
            onValueChange={async (value) => {
              setSelectedManager(value);
              
              if (!sessionId) return;
              try {
                const { data, error } = await supabase
                  .from('tickets')
                  .update({ manager: value })
                  .eq('session_id', sessionId)
                  .select();

                if (error) {
                  console.error('Ошибка обновления менеджера:', error);
                }
              } catch (error) {
                console.error('Ошибка сохранения менеджера:', error);
              }
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AliPay Service">AliPay Service</SelectItem>
              <SelectItem value="Кристина">Кристина</SelectItem>
              <SelectItem value="Евгений">Евгений</SelectItem>
              <SelectItem value="Георгий">Георгий</SelectItem>
              <SelectItem value="Василий">Василий</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="h-[calc(100vh-200px)] flex flex-col dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="border-b dark:border-gray-700">
            <CardTitle className="dark:text-white">Переписка</CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                <Icon name="MessageCircle" size={48} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p>Сообщений пока нет</p>
              </div>
            )}
            
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.is_admin ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex flex-col gap-1 max-w-[70%]">
                  {!msg.is_admin && msg.user_name && (
                    <span className="text-xs text-gray-500 px-2">
                      {msg.user_name}
                    </span>
                  )}
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      msg.is_admin
                        ? 'bg-primary text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow'
                    }`}
                  >
                    {msg.image_url && (
                      <>
                        {msg.image_url.endsWith('.pdf') ? (
                          <a 
                            href={msg.image_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 bg-gray-100 rounded hover:bg-gray-200 transition"
                          >
                            <Icon name="FileText" size={20} className="text-red-500" />
                            <span className="text-sm">Открыть PDF</span>
                          </a>
                        ) : (
                          <img 
                            src={msg.image_url} 
                            alt="Изображение" 
                            className="max-w-full rounded mb-2 cursor-pointer"
                            onClick={() => window.open(msg.image_url!, '_blank')}
                          />
                        )}
                      </>
                    )}
                    {msg.message && (
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                    )}
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="text-xs opacity-70">
                        {new Date(msg.created_at).toLocaleString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {msg.is_admin && (
                        <span className="text-xs">
                          {msg.read_by_user ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </CardContent>

          <div className="p-4 border-t bg-white">
            <div className="mb-3 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputMessage('Здравствуйте, сумма в заявке актуальная?')}
                className="text-xs"
              >
                Здравствуйте, сумма в заявке актуальная?
              </Button>
            </div>
            {imagePreview && (
              <div className="mb-2 relative inline-block">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-h-20 rounded border"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={clearImage}
                >
                  <Icon name="X" size={14} />
                </Button>
              </div>
            )}
            {selectedFile && (
              <div className="mb-2 flex items-center gap-2 bg-gray-100 p-2 rounded">
                <Icon name="FileText" size={16} className="text-red-500" />
                <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={clearFile}
                >
                  <Icon name="X" size={14} />
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || !!selectedFile}
              >
                <Icon name="Image" size={18} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => pdfInputRef.current?.click()}
                disabled={uploading || !!selectedImage}
              >
                <Icon name="FileText" size={18} />
              </Button>
              <Input
                placeholder="Напишите сообщение клиенту..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
                disabled={uploading}
              />
              <Button 
                onClick={sendMessage} 
                disabled={(!inputMessage.trim() && !selectedImage) || uploading}
              >
                {uploading ? <Icon name="Loader2" size={18} className="animate-spin" /> : <Icon name="Send" size={18} />}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
    </div>
  );
};

export default AdminChat;