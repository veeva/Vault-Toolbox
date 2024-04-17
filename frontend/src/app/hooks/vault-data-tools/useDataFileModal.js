import { useState } from 'react';

export default function useDataFileModal() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCellData, setSelectedCellData] = useState(null);

    function handleFileClick(cellData) {
        setSelectedCellData(cellData);
        setIsModalOpen(true);
    }

    const closeModal = () => {
        setSelectedCellData(null);
        setIsModalOpen(false);
    };

    return { isModalOpen, selectedCellData, closeModal, handleFileClick }
}