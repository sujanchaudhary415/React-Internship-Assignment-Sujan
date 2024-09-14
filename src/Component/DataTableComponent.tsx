import { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Button } from 'primereact/button';
import './DataTableComponent.css'; 

interface Artwork {
    id: number;
    title: string;
    place_of_origin: string;
    artist_display: string;
    inscriptions: string;
    date_start: number;
    date_end: number;
    image_id: string;
}

const DataTableComponent: React.FC = () => {
    const [artworks, setArtworks] = useState<Artwork[]>([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [loading, setLoading] = useState(true);
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(12); 
    const [selectedArtworks, setSelectedArtworks] = useState<Artwork[]>([]);
    const [rowCount, setRowCount] = useState<number>(0); 
    const overlayPanelRef = useRef<OverlayPanel>(null);
    const imageOverlayPanelRef = useRef<OverlayPanel>(null);
    const [hoveredImage, setHoveredImage] = useState<string | null>(null);

    const fetchData = async (page: number, pageSize: number) => {
        setLoading(true);
        const response = await fetch(`https://api.artic.edu/api/v1/artworks?page=${page}&limit=${pageSize}`);
        const data = await response.json();
        setArtworks(data.data);
        setTotalRecords(data.pagination.total);
        setLoading(false);
    };

    useEffect(() => {
        fetchData(first / rows + 1, rows);
    }, [first, rows]);

    const onRowSelect = (e: any) => {
        setSelectedArtworks(e.value);
    };

    const onPageChange = (e: any) => {
        setFirst(e.first);
        setRows(e.rows);
        fetchData(e.page + 1, e.rows);
    };

    const imageBodyTemplate = (artwork: Artwork) => {
        const imageUrl = `https://www.artic.edu/iiif/2/${artwork.image_id}/full/200,/0/default.jpg`;
        return (
            <img
                src={imageUrl}
                alt={artwork.title}
                width="100"
                onMouseEnter={(e) => {
                    setHoveredImage(artwork.image_id);
                    imageOverlayPanelRef.current?.toggle(e);
                }}
                onMouseLeave={() => imageOverlayPanelRef.current?.hide()}
            />
        );
    };

    const artistBodyTemplate = (artwork: Artwork) => {
        const artist = artwork.artist_display.split(/[\(,]/)[0].trim();
        return <span className="artist-column">{artist}</span>;
    };

    const truncateText = (text: string, charLimit: number) => {
        if (text.length <= charLimit) return text;
        return text.slice(0, charLimit); 
    };

    const inscriptionsBodyTemplate = (artwork: Artwork) => {
        return <span className="inscriptions-column">{truncateText(artwork.inscriptions || 'N/A', 24)}</span>;
    };

    const startDateBodyTemplate = (artwork: Artwork) => {
        return <span>{artwork.date_start}</span>;
    };

    const endDateBodyTemplate = (artwork: Artwork) => {
        return <span>{artwork.date_end}</span>;
    };

    const statusBodyTemplate = (artwork: Artwork) => {
        return <span>{artwork.place_of_origin || 'Unknown'}</span>;
    };

    const handleRowSelection = async () => {
        const pages = Math.ceil(rowCount / rows);
        let newSelection: Artwork[] = [];
        let rowsToFetch = rowCount;

        for (let page = 1; page <= pages; page++) {
            const response = await fetch(`https://api.artic.edu/api/v1/artworks?page=${page}&limit=${rows}`);
            const data = await response.json();
            const fetchedData = data.data;

            if (page === pages) {
                newSelection = [...newSelection, ...fetchedData.slice(0, rowsToFetch)];
            } else {
                newSelection = [...newSelection, ...fetchedData];
                rowsToFetch -= rows;
            }

            if (rowsToFetch <= 0) break;
        }

        setSelectedArtworks(newSelection);
        setRowCount(0); 
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleRowSelection();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        const cleanedValue = inputValue.replace(/^0+/, '');
        setRowCount(cleanedValue === '' ? 0 : Number(cleanedValue));
    };

    const header = (
        <div className="table-header">
            <div className="header-content">
                <span className="header-title">Artwork Gallery</span>
            </div>
        </div>
    );

    const customHeaderTemplate = () => (
        <div className="custom-header">
            <Button
                icon="pi pi-chevron-down"
                className="p-button-rounded p-button-text"
                onClick={(e) => overlayPanelRef.current?.toggle(e)}
            />
        </div>
    );

    return (
        <div className="datatable-container">
            <OverlayPanel ref={overlayPanelRef} showCloseIcon>
                <div className="overlay-content">
                    <h3>Select Number of Rows</h3>
                    <input
                        type="number"
                        value={rowCount === 0 ? '' : rowCount} 
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter number of rows"
                    />
                    <Button onClick={handleRowSelection}>Submit</Button>
                </div>
            </OverlayPanel>

            <OverlayPanel ref={imageOverlayPanelRef} showCloseIcon>
                {hoveredImage && (
                    <div className="image-overlay">
                        <img
                            src={`https://www.artic.edu/iiif/2/${hoveredImage}/full/843,/0/default.jpg`}
                            alt="Hovered Artwork"
                            width="300"
                        />
                    </div>
                )}
            </OverlayPanel>

            <DataTable
                value={artworks}
                paginator
                rows={rows} 
                lazy
                totalRecords={totalRecords}
                first={first}
                onPage={onPageChange}
                loading={loading}
                selectionMode="checkbox" 
                selection={selectedArtworks}
                onSelectionChange={onRowSelect}
                tableStyle={{ minWidth: '60rem' }}
                header={header}
                dataKey="id"
                className="custom-datatable"
            >
                <Column selectionMode="multiple" headerStyle={{ width: '3em' }}></Column>
                <Column header={customHeaderTemplate} body={() => null} style={{ width: '3em' }}></Column>
                <Column field="title" header="Title"></Column>
                <Column header="Image" body={imageBodyTemplate}></Column>
                <Column header="Artist" body={artistBodyTemplate} className="artist-column"></Column>
                <Column header="Origin" body={statusBodyTemplate}></Column>
                <Column header="Inscriptions" body={inscriptionsBodyTemplate} className="inscriptions-column"></Column>
                <Column field="date_start" header="Start Date" body={startDateBodyTemplate}></Column>
                <Column field="date_end" header="End Date" body={endDateBodyTemplate}></Column>
            </DataTable>
        </div>
    );
};

export default DataTableComponent;
