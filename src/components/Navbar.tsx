import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { safeStorage } from '@/utils/storage';
import { Search, X } from 'lucide-react';

const MAX_RECENT_SEARCHES = 5;

export const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // 최근 검색어 로드
  useEffect(() => {
    try {
      const saved = safeStorage.getItem('recentSearches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (error) {
      console.error('최근 검색어 로드 실패:', error);
      setRecentSearches([]);
    }
  }, []);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowRecent(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const saveRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    try {
      const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, MAX_RECENT_SEARCHES);
      setRecentSearches(updated);
      safeStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch (error) {
      console.error('최근 검색어 저장 실패:', error);
    }
  };

  const handleSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    saveRecentSearch(trimmed);
    setShowRecent(false);
    setSearchQuery('');
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < recentSearches.length) {
        handleSearch(recentSearches[selectedIndex]);
      } else {
        handleSearch(searchQuery);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < recentSearches.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > -1 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowRecent(false);
      searchInputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  return (
    <nav className="border-b bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          {/* 로고 */}
          <Link to="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition flex-shrink-0">
            myblog
          </Link>

          {/* 검색창 */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (recentSearches.length > 0) {
                    setShowRecent(true);
                    setSelectedIndex(-1);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="검색어를 입력하세요"
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* 최근 검색어 드롭다운 */}
            {showRecent && recentSearches.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b">
                  최근 검색어
                </div>
                {recentSearches.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(term)}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                      selectedIndex === index ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{term}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 네비게이션 버튼 */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {user ? (
              <>
                {/* 프로필 정보 표시 */}
                <div className="flex items-center gap-3 mr-2">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.nickname} 
                      className="w-8 h-8 rounded-full object-cover border-2 border-blue-500"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm border-2 border-blue-500">
                      {profile?.nickname?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                    {profile?.nickname || '사용자'}
                  </span>
                </div>

                <Button asChild variant="outline" size="sm">
                  <Link to="/write">✍️ 글쓰기</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to="/mypage">프로필</Link>
                </Button>
                <Button onClick={handleSignOut} variant="outline" size="sm">
                  로그아웃
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline">
                  <Link to="/login">로그인</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">회원가입</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
