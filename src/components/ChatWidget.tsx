import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { MessageService, Message } from '@/lib/supabase';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [userName, setUserName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let sid = localStorage.getItem('chat_session_id');
    if (!sid) {
      sid = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('chat_session_id', sid);
    }
    setSessionId(sid);
  }, []);

  useEffect(() => {
    if (isOpen && sessionId) {
      loadMessages();
      MessageService.markAsRead(sessionId, false);
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, sessionId]);

  useEffect(() => {
    scrollToBottom();
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
      let isQRCode = false;
      
      if (selectedImage) {
        fileUrl = await MessageService.uploadImage(selectedImage);
        isQRCode = true;
      } else if (selectedFile) {
        fileUrl = await MessageService.uploadFile(selectedFile);
      }

      await MessageService.sendMessage(
        sessionId, 
        inputMessage || (selectedFile ? `📄 ${selectedFile.name}` : ''), 
        false, 
        userName || null,
        fileUrl
      );

      if (isQRCode && fileUrl) {
        setTimeout(async () => {
          await MessageService.sendMessage(
            sessionId,
            '✅ QR-код получен!\n\n⏳ Ожидайте, данные для оплаты появятся в чате в течение 2х минут.\n\nНаш менеджер обработает ваш запрос.',
            true,
            null,
            null,
            'AliPay Service'
          );
          loadMessages();
        }, 1000);
      }

      setInputMessage('');
      clearImage();
      clearFile();
      loadMessages();
    } catch (error: any) {
      console.error('Ошибка отправки:', error);
      if (error.message?.includes('лимит')) {
        alert(error.message);
      } else {
        alert('Ошибка отправки сообщения');
      }
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
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          data-chat-widget
          className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50"
          size="lg"
        >
          <Icon name="MessageCircle" size={24} />
        </Button>
      )}

      {isOpen && (
        <Card className="fixed bottom-0 left-0 right-0 md:bottom-4 md:right-4 md:left-auto w-full md:max-w-md h-[100vh] md:h-[500px] md:w-96 shadow-2xl z-50 flex flex-col md:rounded-lg">
          <div className="flex items-center justify-between p-4 border-b bg-primary text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <Icon name="MessageCircle" size={20} />
              <span className="font-semibold">Чат с поддержкой</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-primary-dark"
            >
              <Icon name="X" size={20} />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <Icon name="MessageCircle" size={48} className="mx-auto mb-2 text-gray-300" />
                <p>Начните диалог с нами!</p>
              </div>
            )}
            
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.is_admin ? 'justify-start' : 'justify-end'}`}
              >
                <div className="flex flex-col gap-1">
                  {msg.is_admin && (
                    <span className="text-xs text-gray-500 px-2">
                      Менеджер {msg.manager_name || 'AliPay Service'}
                    </span>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.is_admin
                        ? 'bg-white text-gray-800 shadow'
                        : 'bg-primary text-white'
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
                        {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {!msg.is_admin && (
                        <span className="text-xs">
                          {msg.read_by_admin ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t bg-white rounded-b-lg">
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
                placeholder="Напишите сообщение..."
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
      )}
    </>
  );
}