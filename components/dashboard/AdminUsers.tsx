import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { User, UserRole } from '../../types';
import { api } from '../../services/api';
import { glassCardClass, glassInputClass, ConfirmDialog } from './DashboardShared';

interface AdminUsersProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

export const AdminUsers: React.FC<AdminUsersProps> = ({ users, setUsers }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  
  // Wallet modal state
  const [selectedUserForWallet, setSelectedUserForWallet] = useState<User | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletAction, setWalletAction] = useState<'add' | 'deduct'>('add');
  const [walletAmount, setWalletAmount] = useState('');
  const [isWalletSubmitting, setIsWalletSubmitting] = useState(false);
  const [isWalletActionDropdownOpen, setIsWalletActionDropdownOpen] = useState(false);

  // Add User modal state
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [addFirstName, setAddFirstName] = useState('');
  const [addLastName, setAddLastName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRole, setAddRole] = useState<UserRole>('customer');
  const [isAddUserSubmitting, setIsAddUserSubmitting] = useState(false);
  const [isAddRoleDropdownOpen, setIsAddRoleDropdownOpen] = useState(false);

  // Role filter dropdown
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const roleOptions = [
    { value: 'all', label: t('admin_users_filter_all_roles' as any) || 'All Roles' },
    { value: 'customer', label: t('signup_form_role_customer') },
    { value: 'designer', label: t('signup_form_role_designer') },
    { value: 'tailor', label: t('signup_form_role_tailor') },
    { value: 'manager', label: t('signup_form_role_manager' as any) || 'Manager' },
  ];

  // Delete User confirmation state
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Edit User modal state
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('customer');
  const [isEditUserSubmitting, setIsEditUserSubmitting] = useState(false);
  const [isEditRoleDropdownOpen, setIsEditRoleDropdownOpen] = useState(false);

  // Filters logic
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  const handleWalletSubmit = async () => {
    if (!selectedUserForWallet) return;
    const amount = parseFloat(walletAmount);
    if (isNaN(amount) || amount <= 0) {
      alert(t('admin_wallet_invalid_amount' as any) || 'Please enter a valid amount greater than 0');
      return;
    }

    if (walletAction === 'deduct' && selectedUserForWallet.balance < amount) {
      alert(t('admin_wallet_insufficient_deduct' as any) || 'Deduction exceeds user current balance');
      return;
    }

    setIsWalletSubmitting(true);
    try {
      await api.updateUserWallet(parseInt(selectedUserForWallet.id), walletAction, amount);
      
      setUsers(prev => prev.map(u => 
        u.id === selectedUserForWallet.id 
          ? { 
              ...u, 
              balance: walletAction === 'add' ? u.balance + amount : u.balance - amount 
            } 
          : u
      ));
      
      setIsWalletModalOpen(false);
      setWalletAmount('');
      setSelectedUserForWallet(null);
      alert(t('admin_wallet_success'));
    } catch (err: any) {
      alert(err.message || 'Failed to update user wallet balance');
    } finally {
      setIsWalletSubmitting(false);
    }
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFirstName || !addLastName || !addEmail || !addPassword) {
      alert('All fields are required');
      return;
    }

    setIsAddUserSubmitting(true);
    try {
      const newUserRes = await api.createUser({
        first_name: addFirstName,
        last_name: addLastName,
        email: addEmail,
        password: addPassword,
        role: addRole,
      });

      const userData = newUserRes.user || newUserRes;
      const newUser: User = {
        id: String(userData.id),
        firstName: userData.first_name,
        lastName: userData.last_name,
        email: userData.email,
        role: userData.role as UserRole,
        balance: Number(userData.balance || 0),
        joinedDate: new Date(userData.created_at || Date.now()),
      };

      setUsers(prev => [...prev, newUser]);
      setIsAddUserModalOpen(false);
      
      // Reset form
      setAddFirstName('');
      setAddLastName('');
      setAddEmail('');
      setAddPassword('');
      setAddRole('customer');
    } catch (err: any) {
      alert(err.message || 'Failed to add new user');
    } finally {
      setIsAddUserSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    try {
      await api.deleteUser(parseInt(userToDelete.id));
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      setIsDeleteConfirmOpen(false);
      setUserToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const openEditModal = (u: User) => {
    setEditUser(u);
    setEditFirstName(u.firstName);
    setEditLastName(u.lastName);
    setEditEmail(u.email);
    setEditRole(u.role as UserRole);
    setIsEditUserModalOpen(true);
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    if (!editFirstName || !editLastName || !editEmail) {
      alert('All fields are required');
      return;
    }
    setIsEditUserSubmitting(true);
    try {
      await api.updateUser(parseInt(editUser.id), {
        first_name: editFirstName,
        last_name: editLastName,
        email: editEmail,
        role: editRole,
      });
      setUsers(prev => prev.map(u =>
        u.id === editUser.id
          ? { ...u, firstName: editFirstName, lastName: editLastName, email: editEmail, role: editRole }
          : u
      ));
      setIsEditUserModalOpen(false);
      setEditUser(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update user');
    } finally {
      setIsEditUserSubmitting(false);
    }
  };

  const roleAvatarColors: Record<string, string> = {
    manager: 'from-brand-gold/80 to-amber-700/80',
    designer: 'from-purple-500/80 to-pink-500/80',
    tailor: 'from-blue-500/80 to-cyan-500/80',
    customer: 'from-emerald-500/80 to-teal-500/80',
  };

  return (
    <div className="text-start">
      <div className="animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-serif text-white mb-1">{t('admin_users_title')}</h2>
          <p className="text-sm text-gray-300">{t('admin_users_subtitle')}</p>
        </div>
        <button
          onClick={() => setIsAddUserModalOpen(true)}
          className="px-6 py-2.5 bg-white text-brand-dark font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-brand-gold hover:text-white transition-colors"
        >
          {t('admin_users_add_button' as any) || 'Add New User'}
        </button>
      </div>

      {/* Filters Area */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <input
            type="text"
            placeholder={t('admin_users_search_placeholder' as any) || 'Search by name or email...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={glassInputClass}
          />
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="w-full p-4 border border-white/20 bg-white/5 text-white text-base text-start flex items-center justify-between focus:bg-white/10 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/50 transition-all rounded-xl cursor-pointer"
          >
            <span>{roleOptions.find(r => r.value === selectedRoleFilter)?.label}</span>
            <svg className={`w-4 h-4 text-brand-gold transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isRoleDropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsRoleDropdownOpen(false)} />
              <div className="absolute top-full mt-2 left-0 right-0 z-20 bg-black/90 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
                {roleOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setSelectedRoleFilter(opt.value); setIsRoleDropdownOpen(false); }}
                    className={`w-full px-5 py-3 text-start text-sm font-medium transition-all flex items-center gap-3 ${
                      selectedRoleFilter === opt.value
                        ? 'bg-brand-gold/20 text-brand-gold border-l-2 border-brand-gold'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white border-l-2 border-transparent'
                    }`}
                  >
                    {selectedRoleFilter === opt.value && (
                      <svg className="w-4 h-4 text-brand-gold flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className={glassCardClass + " overflow-x-auto"}>
        <table className="w-full text-start min-w-0 sm:min-w-[600px]">
          <thead className="bg-white/5 text-gray-200 uppercase text-xs font-bold tracking-[0.15em] border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-start">{t('admin_users_table_name')}</th>
              <th className="px-6 py-4 text-start">{t('admin_users_table_role')}</th>
              <th className="px-6 py-4 text-start">{t('admin_users_table_balance')}</th>
              <th className="px-6 py-4 text-end"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredUsers.map(u => (
              <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4 text-start">
                  <div className="flex items-center gap-3">
                    {u.profileImage ? (
                      <img
                        src={u.profileImage}
                        alt={`${u.firstName} ${u.lastName}`}
                        className="w-9 h-9 rounded-full object-cover border border-white/20"
                      />
                    ) : (
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${roleAvatarColors[u.role] || roleAvatarColors.customer} flex items-center justify-center text-white font-bold text-xs shadow-md`}>
                        {u.firstName ? u.firstName[0] : ''}
                        {u.lastName ? u.lastName[0] : ''}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-sm text-white leading-none mb-1">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-xs text-gray-300 font-normal">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-start">
                  <span className="text-xs uppercase font-bold text-gray-400">
                    {t(`signup_form_role_${u.role}` as any)}
                  </span>
                </td>
                <td className="px-6 py-4 font-serif text-base font-medium text-white">
                  ${(typeof u.balance === 'number' && !isNaN(u.balance) ? u.balance : 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-end">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => openEditModal(u)}
                      className="text-blue-400 hover:text-blue-300 text-xs font-bold uppercase tracking-widest"
                    >
                      {t('admin_users_action_edit' as any) || 'Edit'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUserForWallet(u);
                        setWalletAction('add');
                        setIsWalletModalOpen(true);
                      }}
                      className="text-white hover:text-brand-gold text-xs font-bold uppercase tracking-widest"
                    >
                      {t('admin_users_action_wallet')}
                    </button>
                    <button
                      onClick={() => {
                        setUserToDelete(u);
                        setIsDeleteConfirmOpen(true);
                      }}
                      className="text-red-400 hover:text-red-500 text-xs font-bold uppercase tracking-widest"
                    >
                      {t('admin_users_action_delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-xs">
                  {t('admin_users_no_users' as any) || 'No users found matching filters'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>

      {/* Wallet Deposit/Deduction Modal */}
      {isWalletModalOpen && selectedUserForWallet && (
        <div className="fixed inset-0 z-[120] flex items-start justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
          <div className={glassCardClass + " p-6 sm:p-8 max-w-md w-full text-start my-4 max-h-[85vh] overflow-y-auto"}>
            <div className="flex items-center gap-4 mb-6">
              {selectedUserForWallet.profileImage ? (
                <img src={selectedUserForWallet.profileImage} alt="" className="w-12 h-12 rounded-full object-cover border border-white/20" />
              ) : (
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${roleAvatarColors[selectedUserForWallet.role] || roleAvatarColors.customer} flex items-center justify-center text-white font-bold text-xl shadow-md`}>
                  {selectedUserForWallet.firstName ? selectedUserForWallet.firstName[0] : ''}
                  {selectedUserForWallet.lastName ? selectedUserForWallet.lastName[0] : ''}
                </div>
              )}
              <div>
                <h3 className="font-serif text-xl text-white">{t('admin_wallet_modal_title')}</h3>
                <p className="text-sm text-gray-300">
                  {selectedUserForWallet.firstName} {selectedUserForWallet.lastName}
                </p>
              </div>
            </div>
            <div className="p-5 bg-white/5 rounded-2xl mb-6 text-center border border-white/10">
              <p className="text-xs font-bold text-gray-200 uppercase tracking-widest mb-1">
                {t('admin_wallet_current_balance')}
              </p>
              <p className="text-4xl font-serif text-white font-bold">
                ${(typeof selectedUserForWallet.balance === 'number' && !isNaN(selectedUserForWallet.balance) ? selectedUserForWallet.balance : 0).toFixed(2)}
              </p>
            </div>
            <div className="space-y-4 mb-8">
              <div className="relative">
                <label className="block text-xs font-bold text-gray-200 uppercase tracking-widest mb-2">
                  {t('admin_wallet_action_label')}
                </label>
                <button
                  type="button"
                  onClick={() => setIsWalletActionDropdownOpen(!isWalletActionDropdownOpen)}
                  className="w-full p-4 border border-white/20 bg-white/5 text-white text-base text-start flex items-center justify-between focus:bg-white/10 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/50 transition-all rounded-xl cursor-pointer"
                >
                  <span>{walletAction === 'add' ? t('admin_wallet_action_add') : t('admin_wallet_action_deduct')}</span>
                  <svg className={`w-4 h-4 text-brand-gold transition-transform duration-200 ${isWalletActionDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isWalletActionDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsWalletActionDropdownOpen(false)} />
                    <div className="absolute top-full mt-2 left-0 right-0 z-20 bg-black/90 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
                      <button
                        type="button"
                        onClick={() => { setWalletAction('add'); setIsWalletActionDropdownOpen(false); }}
                        className={`w-full px-5 py-3 text-start text-sm font-medium transition-all flex items-center gap-3 ${
                          walletAction === 'add' ? 'bg-brand-gold/20 text-brand-gold border-l-2 border-brand-gold' : 'text-gray-300 hover:bg-white/10 hover:text-white border-l-2 border-transparent'
                        }`}
                      >
                        {walletAction === 'add' && (
                          <svg className="w-4 h-4 text-brand-gold flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span>{t('admin_wallet_action_add')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setWalletAction('deduct'); setIsWalletActionDropdownOpen(false); }}
                        className={`w-full px-5 py-3 text-start text-sm font-medium transition-all flex items-center gap-3 ${
                          walletAction === 'deduct' ? 'bg-brand-gold/20 text-brand-gold border-l-2 border-brand-gold' : 'text-gray-300 hover:bg-white/10 hover:text-white border-l-2 border-transparent'
                        }`}
                      >
                        {walletAction === 'deduct' && (
                          <svg className="w-4 h-4 text-brand-gold flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span>{t('admin_wallet_action_deduct')}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-200 uppercase tracking-widest mb-2">
                  {t('admin_wallet_amount_label')}
                </label>
                <input
                  type="number"
                  className={glassInputClass}
                  placeholder="0.00"
                  value={walletAmount}
                  onChange={e => setWalletAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsWalletModalOpen(false)}
                className="flex-1 py-4 text-gray-400 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors"
              >
                {t('modal_cancel')}
              </button>
              <button
                onClick={handleWalletSubmit}
                disabled={isWalletSubmitting}
                className="flex-1 py-4 bg-white text-black rounded-xl shadow-lg font-bold uppercase tracking-widest text-xs hover:bg-brand-gold hover:text-white transition-colors disabled:opacity-50"
              >
                {isWalletSubmitting ? t('wallet_processing') : t('admin_wallet_submit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-start justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
          <form
            onSubmit={handleAddUserSubmit}
            className={glassCardClass + " p-6 sm:p-8 max-w-md w-full text-start space-y-4 my-4 max-h-[85vh] overflow-y-auto"}
          >
            <h3 className="font-serif text-2xl text-white mb-4">
              {t('admin_users_add_modal_title' as any) || 'Create New Account'}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-200 uppercase tracking-widest mb-1">
                  {t('contact_form_firstName')}
                </label>
                <input
                  type="text"
                  required
                  value={addFirstName}
                  onChange={e => setAddFirstName(e.target.value)}
                  className={glassInputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-200 uppercase tracking-widest mb-1">
                  {t('contact_form_lastName')}
                </label>
                <input
                  type="text"
                  required
                  value={addLastName}
                  onChange={e => setAddLastName(e.target.value)}
                  className={glassInputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-200 uppercase tracking-widest mb-1">
                {t('contact_form_email')}
              </label>
              <input
                type="email"
                required
                value={addEmail}
                onChange={e => setAddEmail(e.target.value)}
                className={glassInputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-200 uppercase tracking-widest mb-1">
                {t('signup_form_password_label' as any) || 'Password'}
              </label>
              <input
                type="password"
                required
                value={addPassword}
                onChange={e => setAddPassword(e.target.value)}
                className={glassInputClass}
              />
            </div>

            <div className="relative">
              <label className="block text-xs font-bold text-gray-200 uppercase tracking-widest mb-1">
                {t('admin_users_table_role')}
              </label>
              <button
                type="button"
                onClick={() => setIsAddRoleDropdownOpen(!isAddRoleDropdownOpen)}
                className="w-full p-4 border border-white/20 bg-white/5 text-white text-base text-start flex items-center justify-between focus:bg-white/10 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/50 transition-all rounded-xl cursor-pointer"
              >
                <span>{roleOptions.find(r => r.value === addRole)?.label || addRole}</span>
                <svg className={`w-4 h-4 text-brand-gold transition-transform duration-200 ${isAddRoleDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isAddRoleDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsAddRoleDropdownOpen(false)} />
                  <div className="absolute top-full mt-2 left-0 right-0 z-20 bg-black/90 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
                    {roleOptions.filter(r => r.value !== 'all').map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setAddRole(opt.value as UserRole); setIsAddRoleDropdownOpen(false); }}
                        className={`w-full px-5 py-3 text-start text-sm font-medium transition-all flex items-center gap-3 ${
                          addRole === opt.value ? 'bg-brand-gold/20 text-brand-gold border-l-2 border-brand-gold' : 'text-gray-300 hover:bg-white/10 hover:text-white border-l-2 border-transparent'
                        }`}
                      >
                        {addRole === opt.value && (
                          <svg className="w-4 h-4 text-brand-gold flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="flex-1 py-3 text-gray-400 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors"
              >
                {t('modal_cancel')}
              </button>
              <button
                type="submit"
                disabled={isAddUserSubmitting}
                className="flex-1 py-3 bg-white text-black rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-brand-gold hover:text-white transition-colors disabled:opacity-50"
              >
                {isAddUserSubmitting ? t('wallet_processing') : t('signup_form_submit_label' as any) || 'Submit'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditUserModalOpen && editUser && (
        <div className="fixed inset-0 z-[120] flex items-start justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
          <form
            onSubmit={handleEditUserSubmit}
            className={glassCardClass + " p-6 sm:p-8 max-w-md w-full text-start space-y-4 my-4 max-h-[85vh] overflow-y-auto"}
          >
            <h3 className="font-serif text-2xl text-white mb-4">
              {t('admin_users_edit_modal_title' as any) || 'Edit User'}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-200 uppercase tracking-widest mb-1">
                  {t('contact_form_firstName')}
                </label>
                <input
                  type="text"
                  required
                  value={editFirstName}
                  onChange={e => setEditFirstName(e.target.value)}
                  className={glassInputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-200 uppercase tracking-widest mb-1">
                  {t('contact_form_lastName')}
                </label>
                <input
                  type="text"
                  required
                  value={editLastName}
                  onChange={e => setEditLastName(e.target.value)}
                  className={glassInputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-200 uppercase tracking-widest mb-1">
                {t('contact_form_email')}
              </label>
              <input
                type="email"
                required
                value={editEmail}
                onChange={e => setEditEmail(e.target.value)}
                className={glassInputClass}
              />
            </div>

            <div className="relative">
              <label className="block text-xs font-bold text-gray-200 uppercase tracking-widest mb-1">
                {t('admin_users_table_role')}
              </label>
              <button
                type="button"
                onClick={() => setIsEditRoleDropdownOpen(!isEditRoleDropdownOpen)}
                className="w-full p-4 border border-white/20 bg-white/5 text-white text-base text-start flex items-center justify-between focus:bg-white/10 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/50 transition-all rounded-xl cursor-pointer"
              >
                <span>{roleOptions.find(r => r.value === editRole)?.label || editRole}</span>
                <svg className={`w-4 h-4 text-brand-gold transition-transform duration-200 ${isEditRoleDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isEditRoleDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsEditRoleDropdownOpen(false)} />
                  <div className="absolute top-full mt-2 left-0 right-0 z-20 bg-black/90 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
                    {roleOptions.filter(r => r.value !== 'all').map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setEditRole(opt.value as UserRole); setIsEditRoleDropdownOpen(false); }}
                        className={`w-full px-5 py-3 text-start text-sm font-medium transition-all flex items-center gap-3 ${
                          editRole === opt.value ? 'bg-brand-gold/20 text-brand-gold border-l-2 border-brand-gold' : 'text-gray-300 hover:bg-white/10 hover:text-white border-l-2 border-transparent'
                        }`}
                      >
                        {editRole === opt.value && (
                          <svg className="w-4 h-4 text-brand-gold flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => { setIsEditUserModalOpen(false); setEditUser(null); }}
                className="flex-1 py-3 text-gray-400 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors"
              >
                {t('modal_cancel')}
              </button>
              <button
                type="submit"
                disabled={isEditUserSubmitting}
                className="flex-1 py-3 bg-white text-black rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-brand-gold hover:text-white transition-colors disabled:opacity-50"
              >
                {isEditUserSubmitting ? t('wallet_processing') : t('admin_users_action_edit' as any) || 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Unified Deletion Confirm Dialog */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title={t('admin_users_delete_confirm' as any) || 'Delete User'}
        message={`${t('admin_users_delete_warning' as any) || 'Are you sure you want to permanently delete user account:'} ${userToDelete?.firstName} ${userToDelete?.lastName}?`}
        confirmText={t('admin_users_action_delete')}
        cancelText={t('modal_cancel')}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteConfirmOpen(false);
          setUserToDelete(null);
        }}
      />
    </div>
  );
};
