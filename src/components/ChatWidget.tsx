import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface Message {
  id: number;
  message: string;
  image_url?: string;
  is_admin: boolean;
  created_at: string;
}

const CHAT_API = 'https://functions.poehali.dev/22875b8b-5f66-444c-bd9f-f429cbc012a6';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const response = await fetch(CHAT_API, {
        headers: { 'X-Session-Id': sessionId }
      });
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
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

  const sendMessage = async () => {
    if ((!inputMessage.trim() && !selectedImage) || !sessionId) return;

    setUploading(true);
    try {
      let imageUrl = null;
      
      if (selectedImage) {
        imageUrl = await convertToBase64(selectedImage);
      }

      await fetch(CHAT_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': sessionId
        },
        body: JSON.stringify({
          message: inputMessage,
          image_url: imageUrl,
          name: 'Клиент'
        })
      });

      setInputMessage('');
      clearImage();
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
        <Card className="fixed bottom-4 right-4 w-full max-w-md h-[85vh] md:h-[500px] md:w-96 shadow-2xl z-50 flex flex-col mx-4 md:mx-0">
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
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.is_admin
                      ? 'bg-white text-gray-800 shadow'
                      : 'bg-primary text-white'
                  }`}
                >
                  {msg.image_url && (
                    <img 
                      src={msg.image_url} 
                      alt="Изображение" 
                      className="max-w-full rounded mb-2 cursor-pointer"
                      onClick={() => window.open(msg.image_url, '_blank')}
                    />
                  )}
                  {msg.message && (
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                  )}
                  <span className="text-xs opacity-70 mt-1 block">
                    {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
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
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Icon name="Image" size={18} />
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